"""
Created by: Julian Evalle

This programs crawls and scrapes specific userdata from the MyAnimeList site and
converts it into a JSON file. It makes us of Selenium to extend auto-extending
pages in a smaller chrome browser

Credit crawling template and non-MAL related functions: mProg UvA
Credit Selenium function(get_source()): Micheal J. Sanders
- https://michaeljsanders.com/2017/05/12/scrapin-and-scrollin.html
"""

import os
import codecs
import errno
import time
import json

from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup
from selenium import webdriver

# https://chromedriver.storage.googleapis.com/index.html?path=2.45/
browser = webdriver.Chrome()

# set username tof account to scrape
username = "VellanShadow"
# username = "Goblok"

# calls upon all other functions
def main():
    # corresponding to page: Completed, OnHold, Dropped & PlanToWatch
    page_index = [2,3,4,6]

    # crawls each seperate page and creates a JSON file for each page
    for index in page_index:
        MAL_URL = f"https://myanimelist.net/animelist/{username}?status={index}"
        # get source data through selenium to obtain extended page
        source_data = get_source(MAL_URL)
        # get MAL list and data
        print('Access MAL list...')
        mal_html = simple_get(MAL_URL)
        mal_dom = BeautifulSoup(source_data)

        # extracts all URL's on the MAL list
        print('Scraping MAL page ...')
        url_strings = scrape_mal(mal_dom)

        # check if the url leads to an error 404 page
        if url_strings == "invalid":
            print("Invalid Username")
            quit()

        # extracts relevant information from each URL
        anime_list = []
        for url in url_strings:
            anime_html = simple_get(url)
            anime_dom = BeautifulSoup(anime_html, "lxml")
            scraped_info = scrape_page(anime_dom)
            anime_list.append(scraped_info)

        with open(f'data/{username}_{index}.json', 'w') as outfile:
            json.dump(anime_list, outfile)


def simple_get(url):
    """
    Attempts to get the content at `url` by making an HTTP GET request.
    If the content-type of response is some kind of HTML/XML, return the
    text content, otherwise return None
    """
    try:
        with closing(get(url, stream=True)) as resp:
            if is_good_response(resp):
                return resp.content
            else:
                return None
    except RequestException as e:
        print('The following error occurred during HTTP GET request to {0} : {1}'.format(url, str(e)))
        return None

def is_good_response(resp):
    """
    Returns true if the response seems to be HTML, false otherwise
    """
    content_type = resp.headers['Content-Type'].lower()
    return (resp.status_code == 200
            and content_type is not None
            and content_type.find('html') > -1)

def get_source(MAL_URL):
    # credit: https://michaeljsanders.com/2017/05/12/scrapin-and-scrollin.html

    # opens the URL through selenium allowing scraping of
    # the fully extended page
    browser.get(MAL_URL)
    lenOfPage = browser.execute_script("window.scrollTo(0, document.body.scrollHeight);var lenOfPage=document.body.scrollHeight;return lenOfPage;")
    match=False
    # keeps scrolling through the page until it has reached the end
    while(match==False):
            lastCount = lenOfPage
            time.sleep(3)
            lenOfPage = browser.execute_script("window.scrollTo(0, document.body.scrollHeight);var lenOfPage=document.body.scrollHeight;return lenOfPage;")
            if lastCount==lenOfPage:
                match=True
    # returns the fully extended page to be scraped
    source_data = browser.page_source
    return source_data

def scrape_mal(soup):
    # check if the page is a valid MAL page
    try:
        if soup.find('h1').text.strip() == "Invalid Username Supplied":
            return "invalid"
    except:
        pass

    anime_urls = []
    # beginning of the MAL link
    base = "https://myanimelist.net"

    # find the table with the links
    table = soup.find('table')
    data = table.find_all("tbody")
    # go through each link
    for entry in data:
        # find the link
        link = entry.find('a')
        url = link.get('href')
        # finds the index of the last "/"
        index = url.rfind("/")
        # cuts the string off at index
        url = url[:index]
        # creates a usable url
        full_link = base + url
        anime_urls.append(full_link)
    # removes the arbitrary tbody data
    anime_urls.pop(0)
    return anime_urls

def scrape_page(dom):
    """
    Returns:
        A list of strings representing the following (in order):
        +title,
        +english title
        +year,
        +season,
        +month,
        +day,
        +episodes,
        +duration,
        +genres,
        +studio,
        +type
    """
    # find title of the page
    title = dom.find('h1')
    title = title.text.strip()

    # find synonyms or english titles
    e_title = dom.find('div', {"class": "spaceit_pad"})
    e_title = e_title.text.strip()

    # filter all divs and check if it contains relevant data
    for detail in dom.find_all('div'):
        detail = detail.text.strip()

        #  extracts date details
        if "Aired:" in detail:
            date = detail.split(" ")
            # check if month and year data is present, else assign unknown
            try:
                # check if the current detail contains too much characters
                # to be relevant data
                if len(date) > 12:
                    continue
                elif len(date) < 5:
                    month = date[2]
                    year = date[3]
                else:
                    month = date[2]
                    year = date[4]
            except IndexError:
                month = "unknown"
                year = "unknown"
        # extracts the premiered season
        elif "Premiered:" in detail:
            season = detail.split(" ")
            season = season[0]
            season = season[11:]
        # extracts the first broadcast date
        elif "Broadcast:" in detail:
            day = detail.split(" ")
            day = day[4]
        # extracts the duration and converts it to full minutes
        elif "Duration:" in detail:
            duration = detail.split(" ")
            # check if data is present
            if ("hr." in detail) and ("min." in detail):
                hours = int(duration[2]) * 60
                minutes = int(duration[4]) + hours
            elif "hr." in detail:
                minutes = int(duration[2]) * 60
            else:
                try:
                    minutes = int(duration[2])
                except ValueError:
                    minutes = "unknown"
        # find all genres on the page and convert it to a list
        elif "Genres:" in detail:
            genres = detail[8:]
            genres = genres.split(", ")
        # extract studio data
        elif "Studios:" in detail:
            studio = detail.split("\n")
            studio.pop(0)
            # does not split studios properly,
            # thus further preprocessing is necessary
            if ", " in studio:
                studio = studio.split(", ")
        # extract the type of data
        elif "Type:" in detail:
            # studio = detail[8:]
            type = detail.split("\n")
            try:
                type = type[1]
            except IndexError:
                type = "unknown"
    # extract amount of episodes data
    episodes = dom.find('span', {"id": "curEps"}).text.strip()
    # check if any data is still missing due to unknown bugs, else check
    # each list entry individually
    try:
        [title, e_title, year, season, month, day, episodes, minutes, genres,
        studio, type]
    except:
        try:
            year
        except NameError:
            year = "unknown"
        try:
            season
        except NameError:
            season = "unknown"
        try:
            month
        except NameError:
            month = "unknown"
        try:
            day
        except NameError:
            day = "unknown"
        try:
            episodes
        except NameError:
            episodes = "unknown"
        try:
            minutes
        except NameError:
            minutes = "unknown"
        try:
            genres
        except NameError:
            genres = ["unknown"]
        try:
            studio
        except NameError:
            studio = ["unknown"]
        try:
            type
        except NameError:
            type = "unknown"

    return [title, e_title, year, season, month, day, episodes, minutes,
            genres, studio, type]

if __name__ == '__main__':
    main()

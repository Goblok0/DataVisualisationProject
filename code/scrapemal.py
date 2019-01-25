
import os
import csv
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

username = "VellanShadow"
# username = "Goblok"
# username = "dsafgsa"




# OUTPUT_CSV = f"{username}.csv"
# SCRIPT_DIR = os.path.split(os.path.realpath(__file__))[0]
# BACKUP_DIR = os.path.join(SCRIPT_DIR, 'HTML_BACKUPS')

def main():
    # corresponding to page: Completed, OnHold, Dropped & PlanToWatch
    page_index = [2,3,4,6]
    # name_index = { 2: "Completed",
    #                3: "OnHold",
    #                4: "Dropped",
    #                6: "PlanToWatch"
    #              }
    # page_index = [4]
    full_anime_list = []
    for index in page_index:
        MAL_URL = f"https://myanimelist.net/animelist/{username}?status={index}"
        source_data = get_source(MAL_URL)
        # Make backup of the IMDB top 250 movies page
        print('Access MAL page...')
        mal_html = simple_get(MAL_URL)
        mal_dom = BeautifulSoup(source_data)

        # extract the top 250 movies
        print('Scraping top 250 page ...')
        url_strings = scrape_mal(mal_dom)
        if url_strings == "invalid":
            print("Invalid Username")
            quit()
        print(len(url_strings))

        anime_list = []
        for url in url_strings:
            anime_html = simple_get(url)
            anime_dom = BeautifulSoup(anime_html, "lxml")
            scraped_info = scrape_page(anime_dom)
            print(scraped_info)
            anime_list.append(scraped_info)
        print(anime_list)
        full_anime_list.append(anime_list)

        with open(f'data/{username}_{index}.json', 'w') as outfile:
            json.dump(anime_list, outfile)
    #
    # with open(f'{username}.json', 'w') as outfile:
    #     json.dump(full_anime_list, outfile)


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
    # https://michaeljsanders.com/2017/05/12/scrapin-and-scrollin.html

    browser.get(MAL_URL)
    lenOfPage = browser.execute_script("window.scrollTo(0, document.body.scrollHeight);var lenOfPage=document.body.scrollHeight;return lenOfPage;")
    match=False
    while(match==False):
            lastCount = lenOfPage
            time.sleep(3)
            lenOfPage = browser.execute_script("window.scrollTo(0, document.body.scrollHeight);var lenOfPage=document.body.scrollHeight;return lenOfPage;")
            if lastCount==lenOfPage:
                match=True
    source_data = browser.page_source
    return source_data

def scrape_mal(soup):

    try:
        if soup.find('h1').text.strip() == "Invalid Username Supplied":
            return "invalid"
    except:
        pass
    # print(soup)
    anime_urls = []
    # beginning of the movie link
    base = "https://myanimelist.net"


    table = soup.find('table')

    data = table.find_all("tbody")
    for entry in data:
        # print(entry)
        link = entry.find('a')
        # print(link_part)
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
        +e.title
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
    title = dom.find('h1')
    title = title.text.strip()

    # print(title)
    e_title = dom.find('div', {"class": "spaceit_pad"})
    e_title = e_title.text.strip()
    # print(e_title)
    for detail in dom.find_all('div'):
        detail = detail.text.strip()
        # print(detail)
        #  extracts date details
        if "Aired:" in detail:
            # print(detail)
            date = detail.split(" ")
            try:
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
            # print(month)
            # print(year)
        # extracts the premiered season
        elif "Premiered:" in detail:
            season = detail.split(" ")
            # print(date)
            season = season[0]
            season = season[11:]
            # print(season)
        elif "Broadcast:" in detail:
            day = detail.split(" ")
            day = day[4]
            # print(day)
        elif "Duration:" in detail:
            duration = detail.split(" ")
            # print(duration)
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
            # print(minutes)
        elif "Genres:" in detail:
            # print(detail)
            genres = detail[8:]
            genres = genres.split(", ")
            # cut off irrelevant string
            # print(genres)
        elif "Studios:" in detail:
            # print(detail)
            # studio = detail[8:]
            studio = detail.split("\n")
            # print(studio)
            studio.pop(0)
            # does not split studios properly
            if ", " in studio:
                studio = studio.split(", ")
            # cut off irrelevant string
            # print(studio)
        elif "Type:" in detail:
            # print(detail)
            # studio = detail[8:]
            type = detail.split("\n")
            try:
                type = type[1]
            except IndexError:
                type = "unknown"
            # cut off irrelevant string
            # print(type)


    episodes = dom.find('span', {"id": "curEps"}).text.strip()

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

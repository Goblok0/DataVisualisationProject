
import os
import csv
import codecs
import errno
import time

from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup
from selenium import webdriver

# https://chromedriver.storage.googleapis.com/index.html?path=2.45/
browser = webdriver.Chrome()

username = "Goblok"




OUTPUT_CSV = f"{username}.csv"
SCRIPT_DIR = os.path.split(os.path.realpath(__file__))[0]
BACKUP_DIR = os.path.join(SCRIPT_DIR, 'HTML_BACKUPS')

def main():

    index = 2
    MAL_URL = f"https://myanimelist.net/animelist/{username}?status={index}"
    source_data = get_source(MAL_URL)
    # Make backup of the IMDB top 250 movies page
    print('Access MAL page, making backup ...')
    mal_html = simple_get(MAL_URL)
    mal_dom = BeautifulSoup(source_data)

    # extract the top 250 movies
    print('Scraping top 250 page ...')
    url_strings = scrape_mal(mal_dom)
    print(len(url_strings))

    details_list = []
    for url in url_strings:

        anime_html = simple_get(url)
        anime_dom = BeautifulSoup(anime_html, "lxml")
        scraped_info = scrape_page(anime_dom)
        details_list.append(scraped_info)


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
        # print(url)
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
        -season,
        +month,
        -day,
        -episodes,
        -duration,
        -genres,
        -studio,
        -type
    """
    title = dom.find('h1')
    title = title.text.strip()
    print(title)
    e_title = dom.find('div', {"class": "spaceit_pad"})
    e_title = e_title.text.strip()
    # print(e_title)
    for detail in dom.find_all('div'):
        detail = detail.text.strip()
        # print(detail)
        if "Aired:" in detail:
            # print(detail)
            date = detail.split(" ")
            if len(date) > 12:
                continue
            print(date)
            if len(date) < 5:
                month = date[2]
                year = date[3]
            else:
                month = date[2]
                year = date[4]

        elif "Premiered:" in detail:
            date = detail.split(" ")
            # print(date)
            season = date[0]
            season = season[11:]
            # print(day)


if __name__ == '__main__':

    main()

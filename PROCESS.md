# day 1
  crawled usable data from the MAL-page

  note: had van het begin al de lijsten moeten opdelen in aparte JSON Files ipv van 1. Heb hele ochtend en halve middag verspilt aan slight internet connection errors door SP wifi
# day 2
  Stage-Training, dus weinig tot geen voortgang
# day 3
  * data pre-processed voor barchart
  * bar chart gemaakt, axis en keluringen zijn nog incorrect

  * note: mogelijk genre title indelen in lijst en lengte van de lijst optellen, maar incrementen van een getal per genre zal beter uitkomen omdat de lijst niet in de barchart gebruikt zal worden

  * note: split de studionamen die blijkbaar nog als 1 string worden gezien ipv van meerdere

  ![alt text](doc/proto_1.png)
  * heb de lay-out anders neergezet dan in de proposal, omdat het mij netter lijkt om ze in een apart vak te doen dan in hetzelfde vak, mogelijk chartvak verlengen zodat de buttonvak zich erin bevind, maar voor nu is dit gestructureerder
# day 4
  Stage-Training, dus weinig tot geen voortgang
# day 5
  * de multi-line chart met jaren en seizoenen als x-axis gaat misschien te lastig worden, dus voor nu zal het alleen jaren worden als x-axis
  * de slide bar zal een range representeren(e.g. 1997 --> 1987:2007), dit zal het makkelijker maken om de slide te implementeren, meerendeels omdat ik dan geen cut off point hoe neer te zetten en omdat je dan de slider niet naar een punt kan plaatsen waarbij alleen de halve chart data presenteert
    * Een knop om alle jaren te laten zien, zal ook mogelijk zijn. aangezien het interessante data is om te representeren
  * de selectie van welke MAL-list gebruikt zal worden is verplaatst van de barschart naar de insert username element, dit is makkelijker terug te vinden.
  * heb zoals gepland, de bar chart data gesplits tussen een grote groep en een kleine groep. de grens van de splitsing is geplaats op 50 (en bij studio 10) omdat het leek dat dat ongeveer een evenredige splitsing zou zorgen tussen de data.
    * later een dynamische grens implementeren, voor gebruikers met meer data
  * note to self: behoud de opties in hun eigen SVG, aangezien ze verplaats moeten worden indien ik extra grafieken ga gebruiken. Hierdoor kunnen ze makkelijk samen verplaats worden indien noodzakelijk
  * Heb de bargrafieken kunnen sorteren dmv D3, wat noodzakelijk is om de data begrijpelijk te presenteren.      
    * Indien tijd over overweeg ook dergelijke sortering op naam

# day 5.3(Saturday)
  * heb de radiobuttons data verdeeld tussen BD(Type data die gebruikt word: Genre of studio) en BT(Welk deel van de gekozen data het gebruikt de grote of kleine hoeveelheden)

from gfg_search import search

results = search("dsa", max_results=5)
for item in results:
    print(item.title)
    print(item.link)
    print(item.snippet)
    print("-")

from gfg_search import GFGSearchClient

client = GFGSearchClient(timeout=12)
results = client.search("python")

first = results[0]
print(first.title)
print(first.link)

from gfg_search import GFGSearchClient

client = GFGSearchClient()
raw_items = client.search_raw("graph")

print(type(raw_items))
print(raw_items[0].keys())

from gfg_search import GFGSearchClient, GFGSearchHTTPError, GFGSearchParsingError

client = GFGSearchClient()

try:
    print(client.search("dynamic programming", max_results=3))
except GFGSearchHTTPError as exc:
    print("Network error:", exc)
except GFGSearchParsingError as exc:
    print("Response format error:", exc)
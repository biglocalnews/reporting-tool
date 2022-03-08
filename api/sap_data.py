import requests
from requests_kerberos import HTTPKerberosAuth
import humps


def search(query):

    data = {"data": []}

    if not query or len(query) < 3:
        return data

    try:
        r = requests.get(
            f"https://laravel-api.mobileapps.bbc.co.uk/sapdata/employees/search?q={query}",
            verify=False,
            auth=HTTPKerberosAuth(),
        )
        # decamilize because Ariadne assumes an API that returns snake case
        data = humps.decamelize(r.json()["data"])
    except Exception as ex:
        print(ex)
        print(r.text)

    return data

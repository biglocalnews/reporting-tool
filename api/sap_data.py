import os
import requests
from requests_kerberos import HTTPKerberosAuth
from requests_ntlm import HttpNtlmAuth
import humps
from settings import settings


def auth():
    if settings.debug:
        # only works over zscaler bizarrely
        return HTTPKerberosAuth()
    return HttpNtlmAuth("national\\ni-app-tig", settings.app_account_pw)


def search(query):

    data = {"data": []}

    if not query or len(query) < 3:
        return data

    try:
        r = requests.get(
            f"https://laravel-api.mobileapps.bbc.co.uk/sapdata/employees/search?q={query}",
            verify=False,
            auth=auth(),
        )
        # decamilize because Ariadne assumes an API that returns snake case
        data = humps.decamelize(r.json()["data"])
    except Exception as ex:
        print(ex)
        print(r.text)

    return data

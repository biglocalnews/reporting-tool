from typing import Any
import json

from fastapi.templating import Jinja2Templates



templates = Jinja2Templates(directory="templates")


# Register custom filters for the templates

def pickattrs(obj: Any, *args: str):
    """Pick some attributes from an object.

    Args:
        obj - Source object
        *args - Names of attributes to pick

    Returns:
        Dict containing picked attributes and their values.
    """
    return {k: getattr(obj, k) for k in args}


templates.env.filters['pickattrs'] = pickattrs
templates.env.filters['jsonify'] = json.dumps

import json
import re

"""
======= Input & Output Data Shape Documentation =====
Request body:
{
    year: int,     // Year of search being made. Necessary for searching the correct data.
    query: string, // Search query.
}

Response body:
{
    people: {
        {
            image: string,          // URL to image to display. Append person.portrait to "/portraits/" for almost every image.
                                    // Note: Use a falsy value if person.portrait is falsy.
            name: string,           // Full name of person. Use person.full_name.
            major: string,          // Person's major or division. Use person.major.
            classification: string, // Person's classification. Use person.classification.
            quote: string,          // Special quote for special people. Use person.quote, if present, else None (or don't include at all).
        }[] // Note: This is an array
    },
    groups: {
        {
            image: string,  // URL of image to display. Use group.pictures[0].
                            // Note: Use a falsy value if group.pictures is empty/falsy.
            name: string,   // Name of group. Use group.name.
            url: string,    // URL of group's page. Using group.slug, return a string of the form: "groups/{slug}.html"
        }[] // Note: This is an array
    },
}
=====================================================
"""

DEBUG = True
# DEBUG = False  # comment/uncomment to enable/disable debug output

def debug(*args, **kwargs):
    if DEBUG: print(*args, **kwargs)

# { year_int: [people_json_path, organizations_json_path] }
year_paths = {
    2020: ["people.json", "organizations.json"],
    2021: ["people_2021.json", "organizations_2021.json"]
}

def lambda_handler(event, context):
    # Determines if event is API Gateway-form
    # If not, indicates event is simple in form; came from testing
    eventIsFromApiGateway = "requestContext" in event and \
                            "apiId" in event["requestContext"]

    # Parse payload
    try:
        body = json.loads(event["body"]) if eventIsFromApiGateway else event
    except:
        raise Exception("Invalid Request")
        
    debug(body)
    
    # Compile the query regex
    body["query"] = re.sub(r"[^a-z]+", ".*", body["query"].lower())
    regex_query = re.compile(f".*{body['query']}.*")

    # Make sure the query is large enough
    if len(re.findall(r"[a-z]", body["query"])) < 3:
        return {"statusCode": 400, "body": json.dumps({"error": "query_too_short"}), "headers": { "Access-Control-Allow-Origin": "*" }}

    # Get file paths for year
    if body["year"] not in year_paths:
        return {"statusCode": 400, "body": json.dumps({"error": "invalid_year"}), "headers": { "Access-Control-Allow-Origin": "*" }}
    paths = year_paths[body["year"]]
    
    # Load people and groups files
    # These should be stored in the Lambda ephemeral filesystem
    people, groups = None, None
    with open(paths[0]) as peoplefile, open(paths[1]) as orgfile:
        people = json.load(peoplefile)["people"]
        groups = json.load(orgfile)["organizations"]
    
    # Filter data
    filtered_people = [p for p in people if regex_query.match(p["full_name"].lower() + " " + p["major"].lower()) is not None]
    people_id = set([p["id"] for p in filtered_people])

    filtered_groups = []
    for g in groups:
        include = False
        include = include or (regex_query.match(g["name"].lower()) is not None)
        include = include or ((g["mascot"] is not None) and (regex_query.match(g["mascot"].lower()) is not None))
        include = include or any((m["id"] in people_id) for m in g["members"])
        if include: filtered_groups.append(g)
    
    # Build the response
    response = {
        "people": [{
            "image": f"/portraits/{p['portrait']}" if p["portrait"] else None,
            "name": p["full_name"],
            "sortkey": (p["last_name"], p["first_name"]),
            "major": p["major"],
            "classification": p["classification"],
            "quote": p.get("quote", None),
        } for p in filtered_people],
        "groups": [{
            "image": g['pictures'][0] if g["pictures"] else None,
            "name": g["name"],
            "url": f"groups/{g['slug']}.html",
        } for g in filtered_groups]
    }

    # Sort the results by name
    response["people"].sort(key=lambda x: x["sortkey"])
    response["groups"].sort(key=lambda x: x["name"])
    
    return {
        "statusCode": 200,
        "body": json.dumps(response),
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json"
        },
    }

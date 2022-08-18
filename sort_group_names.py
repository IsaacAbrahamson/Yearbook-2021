import json
import os

base_dir = "src/data/subgroups/"

for filename in os.listdir(base_dir):
    print(f"Sorting {filename}")

    data = {}
    with open(base_dir + filename, "r") as file:
        data = json.load(file)
    
    for group in data["subgroups"]:
        group["people"] = sorted(group["people"], key=lambda name : " ".join(name.split(" ")[::-1]))
    
    with open(base_dir + filename, "w") as file:
        json.dump(data, file, indent=4)

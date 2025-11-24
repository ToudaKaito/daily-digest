import yaml
from pathlib import Path

def load_sources():
    yaml_path = Path(__file__).parent / "sources.yml"
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["sources"]

def main():
    sources = load_sources()
    print("Loaded sources:")
    for src in sources:
        print(f"- {src['name']} ({src['url']})")

if __name__ == "__main__":
    main()

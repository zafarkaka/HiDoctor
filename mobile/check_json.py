import json
import sys
import os

def check_json_file(filepath):
    print(f"Checking {filepath}...")
    if not os.path.exists(filepath):
        print(f"File {filepath} does not exist!")
        return
        
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            # Try to decode as utf-8
            text = content.decode('utf-8')
            
            # Parse JSON
            data = json.loads(text)
            
            if 'packages' in data:
                print(f"Checking {len(data['packages'])} packages in 'packages'...")
                for pkg_path, pkg_info in data['packages'].items():
                    if 'version' in pkg_info:
                        ver = pkg_info['version']
                        if not ver or not isinstance(ver, str):
                            print(f"ERROR: Package '{pkg_path}' has invalid version: {repr(ver)}")
                    elif pkg_path != "": # Root package might not have it in some lockfile versions, but usually does
                         pass # Some packages might not have version if they are links, but npm usually includes it
            
            if 'dependencies' in data and not isinstance(data.get('packages'), dict):
                # Older lockfile format or requires field
                print(f"Checking 'dependencies' (old format)...")
                def check_deps(deps):
                    for name, info in deps.items():
                        if 'version' in info:
                            if not info['version'] or not isinstance(info['version'], str):
                                print(f"ERROR: Dependency '{name}' has invalid version: {repr(info['version'])}")
                        if 'dependencies' in info:
                            check_deps(info['dependencies'])
                check_deps(data['dependencies'])
                        
    except Exception as e:
        print(f"Error checking {filepath}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_json.py <filepath>")
    else:
        check_json_file(sys.argv[1])

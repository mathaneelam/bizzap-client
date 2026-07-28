import os
import sys
import shutil
import argparse

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

def handover_client(slug, init_git=False):
    client_dir = os.path.join(ROOT_DIR, 'sites', slug)
    if not os.path.exists(client_dir):
        print(f"\x1b[31mError: Client directory not found at: {client_dir}\x1b[0m")
        print("Please ensure the demo website exists first.")
        sys.exit(1)

    template_dir = os.path.join(ROOT_DIR, 'infra', 'templates', 'fullstack-worker-db')
    if not os.path.exists(template_dir):
        print(f"\x1b[31mError: Backend template directory not found at: {template_dir}\x1b[0m")
        sys.exit(1)

    backend_dir = os.path.join(client_dir, 'backend')
    if os.path.exists(backend_dir):
        print(f"\x1b[33mWarning: Backend folder already exists at {backend_dir}.\x1b[0m")
        confirm = input("Do you want to overwrite it? (y/n): ")
        if confirm.lower() != 'y':
            print("Handover cancelled.")
            return
        shutil.rmtree(backend_dir)

    print(f"\n[Handover] Upgrading client '{slug}' to Full-Stack...")
    os.makedirs(backend_dir, exist_ok=True)
    os.makedirs(os.path.join(backend_dir, 'src'), exist_ok=True)

    # List of files to copy and customize
    files_to_copy = [
        ('package.json', 'package.json'),
        ('wrangler.toml', 'wrangler.toml'),
        ('schema.sql', 'schema.sql'),
        ('src/index.ts', 'src/index.ts'),
        ('README.md', 'README.md')
    ]

    for src_rel, dest_rel in files_to_copy:
        src_path = os.path.join(template_dir, src_rel)
        dest_path = os.path.join(backend_dir, dest_rel)
        
        # Read content, replace placeholder, write to destination
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        customized_content = content.replace('__CLIENT_SLUG__', slug)
        
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(customized_content)
            
        print(f"  Copied: backend/{dest_rel}")

    print(f"\x1b[32m[Handover] Reusable backend template successfully initialized at {backend_dir}!\x1b[0m")

    # Initialize separate git repository inside sites/{slug} if requested
    if init_git:
        print("\n[Handover] Initializing separate Git repository inside client folder...")
        try:
            import subprocess
            subprocess.run(['git', 'init'], cwd=client_dir, check=True)
            # Create a simple .gitignore inside sites/{slug} to ignore backend node_modules and wrangler local cache
            gitignore_path = os.path.join(client_dir, '.gitignore')
            if not os.path.exists(gitignore_path):
                with open(gitignore_path, 'w', encoding='utf-8') as f:
                    f.write("node_modules/\n.wrangler/\n.dev.vars\n")
                print("  Created: .gitignore")
            print("\x1b[32m  Git repository initialized inside client folder successfully.\x1b[0m")
        except Exception as e:
            print(f"\x1b[33m  Warning: Failed to initialize git repository: {e}\x1b[0m")

    # Output instructions
    print(f"\n======================================================================")
    print(f"NEXT STEPS TO SETUP CLIENT BACKEND DATABASE:")
    print(f"======================================================================")
    print(f"1. Navigate to: cd sites/{slug}/backend")
    print(f"2. Create the D1 SQLite database in Cloudflare:")
    print(f"   npx wrangler d1 create bizzap-db-{slug}")
    print(f"3. Copy the database ID returned and paste it into wrangler.toml")
    print(f"4. Run migrations to initialize tables:")
    print(f"   npx wrangler d1 execute bizzap-db-{slug} --remote --file=schema.sql")
    print(f"5. Test locally: npm install && npm run dev")
    print(f"6. Deploy live API: npm run deploy")
    print(f"======================================================================\n")

def main():
    parser = argparse.ArgumentParser(description="Bizzap Local Sites — Client Fullstack Handover Helper")
    parser.add_argument('--slug', type=str, required=True, help="Business slug (e.g. 'sri-vinayak-cotsyn')")
    parser.add_argument('--git', action='store_true', help="Initialize a separate git repository inside client directory")
    
    args = parser.parse_args()
    
    handover_client(args.slug, args.git)

if __name__ == '__main__':
    main()

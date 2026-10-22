import os, django

# Delegate database seeding to the ORM-based seed script to prevent SQL format constraints drift
if __name__ == '__main__':
    print("Delegating database seeding to seed_orm.py...")
    import seed_orm


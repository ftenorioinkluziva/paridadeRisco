#!/usr/bin/env python3

import os
import sys
sys.path.append('backend')

from postgres_adapter import PostgreSQLClient

def test_update():
    """Test the PostgreSQL adapter update functionality"""
    print("Testing PostgreSQL adapter update functionality")
    
    # Create client
    client = PostgreSQLClient()
    print(f"Client created: {client}")
    
    # Get table object
    table = client.table('investment_funds')
    print(f"Table object: {table}")
    print(f"Initial WHERE conditions: {table._where_conditions}")
    
    # Add WHERE condition
    table_with_condition = table.eq('id', 1)
    print(f"After .eq(): {table_with_condition}")
    print(f"WHERE conditions after .eq(): {table_with_condition._where_conditions}")
    print(f"Same object? {table is table_with_condition}")
    
    # Try to update
    try:
        data = {'current_value': 1500.00}
        print(f"About to call update with data: {data}")
        print(f"WHERE conditions before update: {table_with_condition._where_conditions}")
        result = table_with_condition.update(data).execute()
        print(f"Update result: {result}")
    except Exception as e:
        print(f"Update failed: {str(e)}")

if __name__ == "__main__":
    test_update()
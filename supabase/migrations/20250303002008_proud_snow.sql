-- Create function to execute SQL (for migrations)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the exec_sql function
CREATE OR REPLACE FUNCTION create_exec_sql_function()
RETURNS void AS $$
BEGIN
  -- This function is just a placeholder since we've already created the exec_sql function
  -- It's used by our migration script to ensure the exec_sql function exists
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION create_exec_sql_function TO authenticated;
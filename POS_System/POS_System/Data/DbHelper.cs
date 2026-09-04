using Microsoft.Data.SqlClient;
using System.Data;

namespace POS_System.Data
{
    public class DbHelper
    {
        private readonly IConfiguration _configuration;

        public DbHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }


        private SqlParameter CreateParameter(string name, object value)
        {
            if (value is byte[] byteValue)
            {
                return new SqlParameter(name, SqlDbType.VarBinary, -1)
                {
                    Value = byteValue
                };
            }
            return new SqlParameter(name, value ?? DBNull.Value);
        }
        public SqlConnection GetConnection()
        {
            string connectionString = _configuration.GetConnectionString("DefaultConnection");
            return new SqlConnection(connectionString);
        }
        //for calling for select queries
        public DataTable ExecuteStoredProcedure(string procName, Dictionary<string, object>? parameters = null)
        {
            using SqlConnection con = GetConnection();
            con.Open();
            using SqlCommand cmd = new SqlCommand(procName, con) { CommandType = CommandType.StoredProcedure };

            if (parameters != null)
            {
                foreach (var param in parameters)
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
            }

            using SqlDataAdapter da = new SqlDataAdapter(cmd);
            DataTable dt = new DataTable();
            da.Fill(dt);
            return dt;
        }

        //for insert, update, delete
        public int ExecuteNonQuery(string procName, Dictionary<string, object>? parameters = null)
        {
            using SqlConnection con = GetConnection();
            using SqlCommand cmd = new SqlCommand(procName, con) { CommandType = CommandType.StoredProcedure };
            if (parameters != null)
            {
                foreach (var param in parameters)
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
            }
            con.Open();
            return cmd.ExecuteNonQuery();


        }
    }
}

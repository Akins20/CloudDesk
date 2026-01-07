import { Client } from 'ssh2';
import { sshService } from './sshService';

export interface DatabaseInfo {
  type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis';
  name: string;
  version?: string;
  isAvailable: boolean;
  clientPath?: string;
}

export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  columns?: string[];
  rowCount?: number;
  affectedRows?: number;
  executionTime?: number;
  error?: string;
}

export interface DatabaseConnection {
  type: DatabaseInfo['type'];
  host: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
}

const DATABASE_CLIENTS: Record<string, { command: string; versionFlag: string }> = {
  mysql: { command: 'mysql', versionFlag: '--version' },
  postgresql: { command: 'psql', versionFlag: '--version' },
  mongodb: { command: 'mongosh', versionFlag: '--version' },
  sqlite: { command: 'sqlite3', versionFlag: '--version' },
  redis: { command: 'redis-cli', versionFlag: '--version' },
};

class DatabaseService {
  /**
   * Detect available database clients on the remote system
   */
  async detectDatabases(client: Client): Promise<DatabaseInfo[]> {
    const databases: DatabaseInfo[] = [];

    for (const [type, config] of Object.entries(DATABASE_CLIENTS)) {
      try {
        // Check if client exists
        const whichResult = await sshService.executeCommand(client, `which ${config.command} 2>/dev/null || echo ""`);
        const clientPath = whichResult.stdout.trim();

        if (clientPath) {
          // Get version
          let version = '';
          try {
            const versionResult = await sshService.executeCommand(client, `${config.command} ${config.versionFlag} 2>/dev/null || echo ""`);
            version = this.parseVersion(versionResult.stdout);
          } catch {
            // Version check failed, client still exists
          }

          databases.push({
            type: type as DatabaseInfo['type'],
            name: this.getDatabaseDisplayName(type),
            version,
            isAvailable: true,
            clientPath,
          });
        } else {
          databases.push({
            type: type as DatabaseInfo['type'],
            name: this.getDatabaseDisplayName(type),
            isAvailable: false,
          });
        }
      } catch {
        databases.push({
          type: type as DatabaseInfo['type'],
          name: this.getDatabaseDisplayName(type),
          isAvailable: false,
        });
      }
    }

    return databases;
  }

  /**
   * Execute a database query
   */
  async executeQuery(
    client: Client,
    connection: DatabaseConnection,
    query: string
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      let command: string;
      let parseResult: (output: string) => QueryResult;

      switch (connection.type) {
        case 'mysql':
          command = this.buildMySQLCommand(connection, query);
          parseResult = this.parseMySQLResult.bind(this);
          break;
        case 'postgresql':
          command = this.buildPostgreSQLCommand(connection, query);
          parseResult = this.parsePostgreSQLResult.bind(this);
          break;
        case 'mongodb':
          command = this.buildMongoDBCommand(connection, query);
          parseResult = this.parseMongoDBResult.bind(this);
          break;
        case 'sqlite':
          command = this.buildSQLiteCommand(connection, query);
          parseResult = this.parseSQLiteResult.bind(this);
          break;
        case 'redis':
          command = this.buildRedisCommand(connection, query);
          parseResult = this.parseRedisResult.bind(this);
          break;
        default:
          return { success: false, error: `Unsupported database type: ${connection.type}` };
      }

      const result = await sshService.executeCommand(client, command, { timeout: 30000 });
      const executionTime = Date.now() - startTime;

      if (result.exitCode !== 0 && result.stderr) {
        return {
          success: false,
          error: result.stderr.trim() || 'Query execution failed',
          executionTime,
        };
      }

      const parsed = parseResult(result.stdout);
      return {
        ...parsed,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * List databases available on the server
   */
  async listDatabases(client: Client, connection: DatabaseConnection): Promise<string[]> {
    try {
      let command: string;

      switch (connection.type) {
        case 'mysql':
          command = this.buildMySQLCommand({ ...connection, database: undefined }, 'SHOW DATABASES;');
          break;
        case 'postgresql':
          command = this.buildPostgreSQLCommand({ ...connection, database: 'postgres' }, '\\l');
          break;
        case 'mongodb':
          command = this.buildMongoDBCommand(connection, 'show dbs');
          break;
        case 'sqlite':
          return connection.database ? [connection.database] : [];
        case 'redis':
          return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
        default:
          return [];
      }

      const result = await sshService.executeCommand(client, command, { timeout: 10000 });

      if (result.exitCode !== 0) {
        throw new Error(result.stderr || 'Failed to list databases');
      }

      return this.parseDatabaseList(connection.type, result.stdout);
    } catch (error) {
      throw new Error(`Failed to list databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List tables/collections in a database
   */
  async listTables(client: Client, connection: DatabaseConnection): Promise<string[]> {
    try {
      let command: string;

      switch (connection.type) {
        case 'mysql':
          command = this.buildMySQLCommand(connection, 'SHOW TABLES;');
          break;
        case 'postgresql':
          command = this.buildPostgreSQLCommand(connection, "\\dt");
          break;
        case 'mongodb':
          command = this.buildMongoDBCommand(connection, 'show collections');
          break;
        case 'sqlite':
          command = this.buildSQLiteCommand(connection, ".tables");
          break;
        case 'redis':
          command = this.buildRedisCommand(connection, 'KEYS *');
          break;
        default:
          return [];
      }

      const result = await sshService.executeCommand(client, command, { timeout: 10000 });

      if (result.exitCode !== 0) {
        throw new Error(result.stderr || 'Failed to list tables');
      }

      return this.parseTableList(connection.type, result.stdout);
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get table/collection schema
   */
  async getTableSchema(
    client: Client,
    connection: DatabaseConnection,
    tableName: string
  ): Promise<{ columns: { name: string; type: string; nullable: boolean }[] }> {
    try {
      let command: string;

      switch (connection.type) {
        case 'mysql':
          command = this.buildMySQLCommand(connection, `DESCRIBE \`${tableName}\`;`);
          break;
        case 'postgresql':
          command = this.buildPostgreSQLCommand(
            connection,
            `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${tableName}';`
          );
          break;
        case 'sqlite':
          command = this.buildSQLiteCommand(connection, `PRAGMA table_info(${tableName});`);
          break;
        default:
          return { columns: [] };
      }

      const result = await sshService.executeCommand(client, command, { timeout: 10000 });

      if (result.exitCode !== 0) {
        throw new Error(result.stderr || 'Failed to get schema');
      }

      return this.parseSchema(connection.type, result.stdout);
    } catch (error) {
      throw new Error(`Failed to get schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========== Helper Methods ==========

  private getDatabaseDisplayName(type: string): string {
    const names: Record<string, string> = {
      mysql: 'MySQL',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
      sqlite: 'SQLite',
      redis: 'Redis',
    };
    return names[type] || type;
  }

  private parseVersion(output: string): string {
    // Extract version number from various formats
    const match = output.match(/(\d+\.\d+(?:\.\d+)?)/);
    return match ? match[1] : '';
  }

  private escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  private buildMySQLCommand(connection: DatabaseConnection, query: string): string {
    const parts = ['mysql', '-N', '-B'];

    if (connection.host && connection.host !== 'localhost') {
      parts.push(`-h ${this.escapeShellArg(connection.host)}`);
    }
    if (connection.port && connection.port !== 3306) {
      parts.push(`-P ${connection.port}`);
    }
    if (connection.username) {
      parts.push(`-u ${this.escapeShellArg(connection.username)}`);
    }
    if (connection.password) {
      parts.push(`-p${this.escapeShellArg(connection.password)}`);
    }
    if (connection.database) {
      parts.push(this.escapeShellArg(connection.database));
    }

    parts.push(`-e ${this.escapeShellArg(query)}`);

    return parts.join(' ');
  }

  private buildPostgreSQLCommand(connection: DatabaseConnection, query: string): string {
    const env: string[] = [];
    const parts = ['psql', '-t', '-A', '-F "|"'];

    if (connection.host) {
      parts.push(`-h ${this.escapeShellArg(connection.host)}`);
    }
    if (connection.port && connection.port !== 5432) {
      parts.push(`-p ${connection.port}`);
    }
    if (connection.username) {
      parts.push(`-U ${this.escapeShellArg(connection.username)}`);
    }
    if (connection.password) {
      env.push(`PGPASSWORD=${this.escapeShellArg(connection.password)}`);
    }
    if (connection.database) {
      parts.push(`-d ${this.escapeShellArg(connection.database)}`);
    }

    parts.push(`-c ${this.escapeShellArg(query)}`);

    return env.length ? `${env.join(' ')} ${parts.join(' ')}` : parts.join(' ');
  }

  private buildMongoDBCommand(connection: DatabaseConnection, query: string): string {
    let uri = 'mongodb://';

    if (connection.username && connection.password) {
      uri += `${encodeURIComponent(connection.username)}:${encodeURIComponent(connection.password)}@`;
    }

    uri += connection.host || 'localhost';

    if (connection.port && connection.port !== 27017) {
      uri += `:${connection.port}`;
    }

    if (connection.database) {
      uri += `/${connection.database}`;
    }

    return `mongosh ${this.escapeShellArg(uri)} --quiet --eval ${this.escapeShellArg(query)}`;
  }

  private buildSQLiteCommand(connection: DatabaseConnection, query: string): string {
    const dbPath = connection.database || ':memory:';
    return `sqlite3 -header -separator '|' ${this.escapeShellArg(dbPath)} ${this.escapeShellArg(query)}`;
  }

  private buildRedisCommand(connection: DatabaseConnection, query: string): string {
    const parts = ['redis-cli'];

    if (connection.host && connection.host !== 'localhost') {
      parts.push(`-h ${this.escapeShellArg(connection.host)}`);
    }
    if (connection.port && connection.port !== 6379) {
      parts.push(`-p ${connection.port}`);
    }
    if (connection.password) {
      parts.push(`-a ${this.escapeShellArg(connection.password)}`);
    }
    if (connection.database) {
      parts.push(`-n ${connection.database}`);
    }

    // Split query into command parts
    parts.push(query);

    return parts.join(' ');
  }

  private parseMySQLResult(output: string): QueryResult {
    const lines = output.trim().split('\n').filter(Boolean);

    if (lines.length === 0) {
      return { success: true, data: [], columns: [], rowCount: 0 };
    }

    // Try to parse as data
    const data: Record<string, unknown>[] = [];

    for (const line of lines) {
      const values = line.split('\t');
      const row: Record<string, unknown> = {};
      values.forEach((val, idx) => {
        row[`col${idx + 1}`] = val === 'NULL' ? null : val;
      });
      data.push(row);
    }

    return {
      success: true,
      data,
      rowCount: data.length,
    };
  }

  private parsePostgreSQLResult(output: string): QueryResult {
    const lines = output.trim().split('\n').filter(Boolean);

    if (lines.length === 0) {
      return { success: true, data: [], columns: [], rowCount: 0 };
    }

    const data: Record<string, unknown>[] = [];

    for (const line of lines) {
      const values = line.split('|');
      const row: Record<string, unknown> = {};
      values.forEach((val, idx) => {
        row[`col${idx + 1}`] = val.trim() === '' ? null : val.trim();
      });
      data.push(row);
    }

    return {
      success: true,
      data,
      rowCount: data.length,
    };
  }

  private parseMongoDBResult(output: string): QueryResult {
    try {
      // MongoDB outputs JSON
      const data = JSON.parse(output);
      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        rowCount: Array.isArray(data) ? data.length : 1,
      };
    } catch {
      // Not JSON, return as text
      return {
        success: true,
        data: [{ result: output.trim() }],
        rowCount: 1,
      };
    }
  }

  private parseSQLiteResult(output: string): QueryResult {
    const lines = output.trim().split('\n').filter(Boolean);

    if (lines.length === 0) {
      return { success: true, data: [], columns: [], rowCount: 0 };
    }

    // First line is headers
    const columns = lines[0].split('|');
    const data: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('|');
      const row: Record<string, unknown> = {};
      columns.forEach((col, idx) => {
        row[col] = values[idx] === '' ? null : values[idx];
      });
      data.push(row);
    }

    return {
      success: true,
      data,
      columns,
      rowCount: data.length,
    };
  }

  private parseRedisResult(output: string): QueryResult {
    const lines = output.trim().split('\n').filter(Boolean);

    return {
      success: true,
      data: lines.map((line, idx) => ({ key: idx, value: line })),
      rowCount: lines.length,
    };
  }

  private parseDatabaseList(type: string, output: string): string[] {
    const lines = output.trim().split('\n').filter(Boolean);

    switch (type) {
      case 'mysql':
        return lines;
      case 'postgresql':
        // PostgreSQL \l output has format: name|owner|encoding|...
        return lines.map(line => line.split('|')[0].trim()).filter(Boolean);
      case 'mongodb':
        // MongoDB output: dbname  size
        return lines.map(line => line.split(/\s+/)[0]).filter(Boolean);
      default:
        return lines;
    }
  }

  private parseTableList(type: string, output: string): string[] {
    const lines = output.trim().split('\n').filter(Boolean);

    switch (type) {
      case 'mysql':
        return lines;
      case 'postgresql':
        // PostgreSQL \dt output has format: schema|name|type|owner
        return lines.map(line => line.split('|')[1]?.trim()).filter(Boolean);
      case 'mongodb':
        return lines;
      case 'sqlite':
        // SQLite .tables outputs space-separated
        return lines.flatMap(line => line.split(/\s+/)).filter(Boolean);
      case 'redis':
        return lines;
      default:
        return lines;
    }
  }

  private parseSchema(type: string, output: string): { columns: { name: string; type: string; nullable: boolean }[] } {
    const lines = output.trim().split('\n').filter(Boolean);
    const columns: { name: string; type: string; nullable: boolean }[] = [];

    switch (type) {
      case 'mysql':
        // MySQL DESCRIBE output: Field|Type|Null|Key|Default|Extra
        for (const line of lines) {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            columns.push({
              name: parts[0],
              type: parts[1],
              nullable: parts[2].toLowerCase() === 'yes',
            });
          }
        }
        break;
      case 'postgresql':
        // Our query returns: column_name|data_type|is_nullable
        for (const line of lines) {
          const parts = line.split('|');
          if (parts.length >= 3) {
            columns.push({
              name: parts[0].trim(),
              type: parts[1].trim(),
              nullable: parts[2].trim().toLowerCase() === 'yes',
            });
          }
        }
        break;
      case 'sqlite':
        // PRAGMA table_info output: cid|name|type|notnull|dflt_value|pk
        for (const line of lines) {
          const parts = line.split('|');
          if (parts.length >= 4) {
            columns.push({
              name: parts[1],
              type: parts[2],
              nullable: parts[3] === '0',
            });
          }
        }
        break;
    }

    return { columns };
  }
}

export const databaseService = new DatabaseService();
export default databaseService;

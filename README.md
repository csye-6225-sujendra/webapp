# webapp

<h2>Installation</h2>

<ol>
<li>Clone the repository:
<pre><code>git clone &lt;repository_url&gt;
</code></pre>
</li>
<li>Install dependencies:
<pre><code>npm install
</code></pre>
</li>
</ol>

<h2>Usage</h2>


<p>To start the server, run:</p>
<pre><code>npm start
</code></pre>

<p>The server will start running at <code>http://localhost:3000</code>.</p>

<h2>Routes</h2>

<ul>
<li><code>GET /healthz</code>: Endpoint to check the health of the server.</li>
<li><code>POST /v1/user</code>: Endpoint to create a new user.</li>
<li><code>PUT /v1/user/self</code>: Endpoint to update the details of the authenticated user.</li>
<li><code>GET /v1/user/self</code>: Endpoint to get the details of the authenticated user.</li>
</ul>

<h2>Dependencies</h2>


<ul>
<li><a href="https://www.npmjs.com/package/bcrypt">bcrypt</a>: Library for hashing passwords.</li>
<li><a href="https://www.npmjs.com/package/dotenv">dotenv</a>: Library for loading environment variables from a .env file.</li>
<li><a href="https://www.npmjs.com/package/express">express</a>: Web framework for Node.js.</li>
<li><a href="https://www.npmjs.com/package/morgan">morgan</a>: HTTP request logger middleware for Node.js.</li>
<li><a href="https://www.npmjs.com/package/mysql2">mysql2</a>: MySQL cli


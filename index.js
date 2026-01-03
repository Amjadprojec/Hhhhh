export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Error: Tambahkan ?url= di akhir link', { status: 400 });
    }

    try {
      const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });

      modifiedRequest.headers.delete('Origin');

      const response = await fetch(modifiedRequest);

      const newResponse = new Response(response.body, response);
      
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', '*');

      return newResponse;
    } catch (error) {
      return new Response('Proxy error: ' + error.message, { status: 500 });
    }
  }
}

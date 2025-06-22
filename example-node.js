/**
 * Advance HTTP Client - Node.js Examples
 * 
 * This file demonstrates all features of the advance-http-client library
 * for Node.js environments (Node.js 18+ with built-in fetch support).
 * 
 * Run with: node example-node.js
 */

// Import the HttpClient (ESM syntax)
import HttpClient from './dist/esm/index.js';

// For CommonJS environments, use:
// const HttpClient = require('./dist/cjs/index.js');

console.log('🚀 Advance HTTP Client - Node.js Examples\n');

// ============================================================================
// 1. BASIC USAGE - Static Methods
// ============================================================================

async function basicUsageExamples() {
  console.log('📋 1. BASIC USAGE - Static Methods');
  console.log('=====================================\n');

  try {
    // GET request
    console.log('🔍 GET Request:');
    const getResponse = await HttpClient.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('Status:', getResponse.status);
    console.log('Data:', getResponse.data);
    console.log('Headers:', getResponse.headers);
    console.log('');

    // POST request
    console.log('📤 POST Request:');
    const postData = {
      title: 'Test Post',
      body: 'This is a test post from advance-http-client',
      userId: 1
    };
    const postResponse = await HttpClient.post('https://jsonplaceholder.typicode.com/posts', postData);
    console.log('Status:', postResponse.status);
    console.log('Created Post:', postResponse.data);
    console.log('');

    // PATCH request
    console.log('🔧 PATCH Request:');
    const patchData = { title: 'Updated Title' };
    const patchResponse = await HttpClient.patch('https://jsonplaceholder.typicode.com/posts/1', patchData);
    console.log('Status:', patchResponse.status);
    console.log('Updated Post:', patchResponse.data);
    console.log('');

    // DELETE request
    console.log('🗑️ DELETE Request:');
    const deleteResponse = await HttpClient.delete('https://jsonplaceholder.typicode.com/posts/1');
    console.log('Status:', deleteResponse.status);
    console.log('Delete Response:', deleteResponse.data);
    console.log('');

  } catch (error) {
    console.error('❌ Error in basic usage:', error.message);
  }
}

// ============================================================================
// 2. INSTANCE CONFIGURATION
// ============================================================================

async function instanceConfigurationExamples() {
  console.log('⚙️ 2. INSTANCE CONFIGURATION');
  console.log('==============================\n');

  // Create an instance with baseURL and default headers
  const api = HttpClient.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
    headers: {
      'Authorization': 'Bearer your-token-here',
      'X-API-Version': '1.0',
      'Content-Type': 'application/json'
    }
  });

  try {
    // GET request using instance (baseURL is automatically prepended)
    console.log('🔍 Instance GET Request:');
    const response = await api.get('/posts/2');
    console.log('Full URL:', response.config.url);
    console.log('Data:', response.data);
    console.log('');

    // POST request with instance defaults
    console.log('📤 Instance POST Request:');
    const newPost = {
      title: 'Instance Post',
      body: 'Created using HttpClient instance',
      userId: 1
    };
    const postResponse = await api.post('/posts', newPost);
    console.log('Status:', postResponse.status);
    console.log('Created:', postResponse.data);
    console.log('');

  } catch (error) {
    console.error('❌ Error in instance configuration:', error.message);
  }
}

// ============================================================================
// 3. GLOBAL HEADERS
// ============================================================================

async function globalHeadersExamples() {
  console.log('🌐 3. GLOBAL HEADERS');
  console.log('=====================\n');

  // Set global headers that will be sent with all requests
  HttpClient.setHeader('X-Global-Header', 'global-value');
  HttpClient.setHeader('User-Agent', 'advance-http-client/1.0.0');

  try {
    console.log('🔍 Request with Global Headers:');
    const response = await HttpClient.get('https://httpbin.org/headers');
    console.log('Response shows our global headers were sent:');
    console.log('Headers sent:', response.data.headers);
    console.log('');

  } catch (error) {
    console.error('❌ Error with global headers:', error.message);
  }
}

// ============================================================================
// 4. HEADER PRECEDENCE
// ============================================================================

async function headerPrecedenceExamples() {
  console.log('📊 4. HEADER PRECEDENCE');
  console.log('========================\n');

  // Set global header
  HttpClient.setHeader('X-Header', 'global-value');

  // Create instance with different header value
  const api = HttpClient.create({
    headers: {
      'X-Header': 'instance-value',
      'X-Instance-Only': 'instance-only'
    }
  });

  try {
    console.log('🔍 Testing Header Precedence:');
    const response = await api.get('https://httpbin.org/headers', {
      headers: {
        'X-Header': 'request-value',
        'X-Request-Only': 'request-only'
      }
    });

    console.log('Headers sent (request > instance > global):');
    console.log('X-Header:', response.data.headers['X-Header']);
    console.log('X-Instance-Only:', response.data.headers['X-Instance-Only']);
    console.log('X-Request-Only:', response.data.headers['X-Request-Only']);
    console.log('');

  } catch (error) {
    console.error('❌ Error in header precedence:', error.message);
  }
}

// ============================================================================
// 5. ISOLATED REQUESTS
// ============================================================================

async function isolatedRequestExamples() {
  console.log('🔒 5. ISOLATED REQUESTS');
  console.log('========================\n');

  // Set global and instance headers
  HttpClient.setHeader('X-Global', 'global-header');
  const api = HttpClient.create({
    baseURL: 'https://jsonplaceholder.typicode.com',
    headers: {
      'X-Instance': 'instance-header',
      'Authorization': 'Bearer instance-token'
    }
  });

  try {
    // Completely isolated request
    console.log('🔒 Completely Isolated Request:');
    const isolatedResponse = await HttpClient.post(
      'https://httpbin.org/post',
      { message: 'isolated request' },
      { 
        isolated: true,
        headers: { 'X-Isolated': 'isolated-only' }
      }
    );
    console.log('Isolated request headers:', isolatedResponse.data.headers);
    console.log('');

    // Isolated request with selective header inclusion
    console.log('🔒 Isolated Request with Selective Headers:');
    const selectiveResponse = await api.post(
      'https://jsonplaceholder.typicode.com/posts',
      { title: 'Selective Headers Post' },
      {
        isolated: true,
        includeHeaders: ['X-Global', 'Authorization'],
        headers: { 'X-Selective': 'selective-only' }
      }
    );
    console.log('Selective isolated request completed');
    console.log('Response status:', selectiveResponse.status);
    console.log('Response data:', selectiveResponse.data);
    console.log('');

  } catch (error) {
    console.error('❌ Error in isolated requests:', error.message);
  }
}

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

async function errorHandlingExamples() {
  console.log('⚠️ 6. ERROR HANDLING');
  console.log('=====================\n');

  try {
    // 404 Error
    console.log('🔍 Testing 404 Error:');
    await HttpClient.get('https://jsonplaceholder.typicode.com/nonexistent');
  } catch (error) {
    console.log('✅ 404 Error caught:');
    console.log('Status:', error.response.status);
    console.log('Status Text:', error.response.statusText);
    console.log('Response Data:', error.response.data);
    console.log('');
  }

  try {
    // 500 Error
    console.log('🔍 Testing 500 Error:');
    await HttpClient.get('https://httpbin.org/status/500');
  } catch (error) {
    console.log('✅ 500 Error caught:');
    console.log('Status:', error.response.status);
    console.log('Status Text:', error.response.statusText);
    console.log('');
  }

  // Network error (invalid URL)
  try {
    console.log('🔍 Testing Network Error:');
    await HttpClient.get('https://invalid-domain-that-does-not-exist.com');
  } catch (error) {
    console.log('✅ Network Error caught:');
    console.log('Error:', error.message);
    console.log('');
  }
}

// ============================================================================
// 7. CONTENT TYPE HANDLING
// ============================================================================

async function contentTypeExamples() {
  console.log('📄 7. CONTENT TYPE HANDLING');
  console.log('============================\n');

  try {
    // JSON response
    console.log('🔍 JSON Response:');
    const jsonResponse = await HttpClient.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('Content-Type:', jsonResponse.headers['content-type']);
    console.log('Data Type:', typeof jsonResponse.data);
    console.log('Data:', jsonResponse.data);
    console.log('');

    // Text response
    console.log('🔍 Text Response:');
    const textResponse = await HttpClient.get('https://httpbin.org/robots.txt');
    console.log('Content-Type:', textResponse.headers['content-type']);
    console.log('Data Type:', typeof textResponse.data);
    console.log('Data (first 100 chars):', textResponse.data.substring(0, 100));
    console.log('');

    // Form data
    console.log('🔍 Form Data Response:');
    const formResponse = await HttpClient.get('https://httpbin.org/forms/post');
    console.log('Content-Type:', formResponse.headers['content-type']);
    console.log('Data Type:', typeof formResponse.data);
    console.log('');

  } catch (error) {
    console.error('❌ Error in content type handling:', error.message);
  }
}

// ============================================================================
// 8. ADVANCED REQUEST OPTIONS
// ============================================================================

async function advancedOptionsExamples() {
  console.log('🔧 8. ADVANCED REQUEST OPTIONS');
  console.log('===============================\n');

  try {
    // Custom headers and method override
    console.log('🔍 Custom Request with Options:');
    const customResponse = await HttpClient.get('https://httpbin.org/headers', {
      headers: {
        'X-Custom-Header': 'custom-value',
        'Accept': 'application/json'
      }
    });
    console.log('Custom headers sent:', customResponse.data.headers);
    console.log('');

    // DELETE with body
    console.log('🗑️ DELETE Request with Body:');
    const deleteWithBody = await HttpClient.delete('https://httpbin.org/delete', {
      message: 'This is a delete request with a body'
    });
    console.log('Delete with body response:', deleteWithBody.data);
    console.log('');

    // Instance with custom options
    console.log('⚙️ Instance with Custom Options:');
    const api = HttpClient.create({
      baseURL: 'https://httpbin.org'
    });
    
    const instanceResponse = await api.get('/user-agent', {
      headers: {
        'X-Instance-Custom': 'instance-custom-value'
      }
    });
    console.log('Instance custom request completed');
    console.log('User-Agent:', instanceResponse.data['user-agent']);
    console.log('');

  } catch (error) {
    console.error('❌ Error in advanced options:', error.message);
  }
}

// ============================================================================
// 9. REAL-WORLD API EXAMPLE
// ============================================================================

async function realWorldExample() {
  console.log('🌍 9. REAL-WORLD API EXAMPLE');
  console.log('=============================\n');

  try {
    // GitHub API example (works in Node.js, but has CORS restrictions in browsers)
    console.log('🔍 GitHub User Info (Node.js only - CORS restricted in browsers):');
    const githubApi = HttpClient.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'advance-http-client-example'
      }
    });
    
    const userResponse = await githubApi.get('/users/octocat');
    console.log('Username:', userResponse.data.login);
    console.log('Name:', userResponse.data.name);
    console.log('Followers:', userResponse.data.followers);
    console.log('');

    // JSONPlaceholder API example (works in both Node.js and browsers)
    console.log('🔍 JSONPlaceholder API (CORS-friendly for browsers):');
    const placeholderApi = HttpClient.create({
      baseURL: 'https://jsonplaceholder.typicode.com',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'advance-http-client-example'
      }
    });
    
    const userInfo = await placeholderApi.get('/users/1');
    console.log('Username:', userInfo.data.username);
    console.log('Name:', userInfo.data.name);
    console.log('Email:', userInfo.data.email);
    console.log('Company:', userInfo.data.company.name);
    console.log('');

    // GitHub repositories (Node.js only)
    console.log('📚 GitHub Repositories (Node.js only):');
    const reposResponse = await githubApi.get('/users/octocat/repos');
    console.log('Repository count:', reposResponse.data.length);
    console.log('First 3 repos:');
    reposResponse.data.slice(0, 3).forEach(repo => {
      console.log(`  - ${repo.name}: ${repo.description || 'No description'}`);
    });
    console.log('');

    // JSONPlaceholder posts (CORS-friendly)
    console.log('📚 JSONPlaceholder Posts (CORS-friendly):');
    const postsResponse = await placeholderApi.get('/posts');
    console.log('Post count:', postsResponse.data.length);
    console.log('First 3 posts:');
    postsResponse.data.slice(0, 3).forEach(post => {
      console.log(`  - ${post.title.substring(0, 50)}...`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error in real-world example:', error.message);
  }
}

// ============================================================================
// 10. PERFORMANCE EXAMPLE
// ============================================================================

async function performanceExample() {
  console.log('⚡ 10. PERFORMANCE EXAMPLE');
  console.log('===========================\n');

  const api = HttpClient.create({
    baseURL: 'https://jsonplaceholder.typicode.com'
  });

  try {
    console.log('🚀 Making multiple concurrent requests...');
    const startTime = Date.now();

    // Make multiple concurrent requests
    const promises = [
      api.get('/posts/1'),
      api.get('/posts/2'),
      api.get('/posts/3'),
      api.get('/posts/4'),
      api.get('/posts/5')
    ];

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    console.log(`✅ Completed ${responses.length} requests in ${endTime - startTime}ms`);
    console.log('Average time per request:', Math.round((endTime - startTime) / responses.length), 'ms');
    console.log('');

  } catch (error) {
    console.error('❌ Error in performance example:', error.message);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllExamples() {
  try {
    await basicUsageExamples();
    await instanceConfigurationExamples();
    await globalHeadersExamples();
    await headerPrecedenceExamples();
    await isolatedRequestExamples();
    await errorHandlingExamples();
    await contentTypeExamples();
    await advancedOptionsExamples();
    await realWorldExample();
    await performanceExample();

    console.log('🎉 All examples completed successfully!');
    console.log('\n📚 For more information, check the README.md file.');
    console.log('🔗 GitHub: https://github.com/yourusername/advance-http-client');

  } catch (error) {
    console.error('❌ Fatal error running examples:', error);
    process.exit(1);
  }
}

// Run all examples
runAllExamples();

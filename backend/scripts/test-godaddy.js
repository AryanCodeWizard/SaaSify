import 'dotenv/config';

import godaddy from '../src/services/godaddy.service.js';

async function testGoDaddyServices() {
  console.log('\n🔍 Testing GoDaddy API Services...\n');

  // Test 1: Check single domain availability
  console.log('1️⃣ Testing Domain Availability Check...');
  try {
    const result = await godaddy.checkAvailability('testdomain12345.com');
    console.log('✅ Domain Availability:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 2: Bulk availability check
  console.log('\n2️⃣ Testing Bulk Domain Check...');
  try {
    const domains = ['test1.com', 'test2.net', 'test3.org'];
    const results = await godaddy.checkBulkAvailability(domains);
    console.log('✅ Bulk Check Results:', results);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 3: Domain suggestions
  console.log('\n3️⃣ Testing Domain Suggestions...');
  try {
    const suggestions = await godaddy.getDomainSuggestions('mycompany', { maxResults: 5 });
    console.log('✅ Suggestions:', suggestions);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 4: TLD pricing
  console.log('\n4️⃣ Testing TLD Pricing...');
  try {
    const pricing = await godaddy.getDomainPricing('com');
    console.log('✅ .com Pricing:', pricing);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test 5: Supported TLDs
  console.log('\n5️⃣ Testing Supported TLDs...');
  try {
    const tlds = await godaddy.getSupportedTLDs();
    console.log(`✅ Found ${tlds.length} TLDs`);
    console.log('Sample TLDs:', tlds.slice(0, 10));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✅ GoDaddy API Testing Complete!\n');
}

testGoDaddyServices().catch(console.error);
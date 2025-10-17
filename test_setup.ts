// Test script to check if all requirements are met

const requiredFiles = [
  { name: "Merriweather-Regular.ttf", type: "font" },
  { name: "Merriweather-Bold.ttf", type: "font" },
  { name: "Merriweather-Italic.ttf", type: "font" },
  { name: "background.jpeg", type: "image" },
  { name: "example_input.json", type: "data" },
];

console.log("🔍 Checking setup requirements...\n");

let allPresent = true;

for (const file of requiredFiles) {
  try {
    const stat = await Deno.stat(`./${file.name}`);
    console.log(`✅ ${file.name} - Found (${(stat.size / 1024).toFixed(2)} KB)`);
  } catch {
    console.log(`❌ ${file.name} - Missing`);
    allPresent = false;
  }
}

console.log("\n" + "=".repeat(50) + "\n");

if (!allPresent) {
  console.log("📝 Missing files detected. Here's how to get them:\n");
  
  console.log("🔤 Fonts (Merriweather):");
  console.log("   Download from: https://fonts.google.com/specimen/Merriweather");
  console.log("   Click 'Download family' and extract the TTF files\n");
  
  console.log("🖼️  Background Image:");
  console.log("   You need a background.jpeg file (1080x1350px recommended)");
  console.log("   You can use any solid color or gradient image\n");
  
  console.log("💡 Quick test option:");
  console.log("   Run: deno run --allow-net --allow-write download_test_assets.ts");
  console.log("   (I can create this script to download sample assets)\n");
} else {
  console.log("🎉 All required files are present!\n");
  console.log("Ready to generate images. Run:");
  console.log('   deno run --allow-read --allow-write generate_image.ts "$(cat example_input.json)"');
  console.log("\nOr use the task:");
  console.log('   deno task generate "$(cat example_input.json)"');
}



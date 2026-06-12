const { execSync } = require('child_process');

try {
  const output = execSync('npx netlify api listSiteDeploys --data "{\\"site_id\\":\\"cfdcc118-63da-4e6f-b9a4-70d37405f4a6\\"}"', {
    stdio: 'pipe'
  });
  const deploys = JSON.parse(output.toString());
  console.log("deploys_count:", deploys.length);
  deploys.slice(0, 5).forEach((d, i) => {
    console.log(`[Deploy ${i}] ID: ${d.id}, State: ${d.state}, Branch: ${d.branch}, Commit: ${d.commit_ref}, CreatedAt: ${d.created_at}`);
  });
} catch (err) {
  console.error("Error executing netlify API:", err.message);
  if (err.stderr) console.error("stderr:", err.stderr.toString());
  if (err.stdout) console.log("stdout:", err.stdout.toString());
}

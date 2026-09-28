import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'/run/current-system/sw/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4178/',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Find the rhythm'}).waitFor();
 assert.equal(await page.locator('canvas').count(),1);
 await page.getByLabel('STRING LENGTH',{exact:true}).fill('1.55');
 await page.getByText('CHALLENGE COMPLETE').waitFor();
 await page.getByRole('button',{name:'Pause simulation'}).click();
 assert.ok((await page.getByRole('button',{name:'Play simulation'}).count())>0);
 await page.getByRole('button',{name:'Wave interference'}).click();
 await page.getByRole('heading',{name:'Make waves meet'}).waitFor();
 assert.equal(await page.getByText('CHALLENGE COMPLETE').count(),0);
 await page.getByLabel('PHASE OFFSET',{exact:true}).fill('180');
 await page.getByText('CHALLENGE COMPLETE').waitFor();
 await page.getByRole('button',{name:'Projectile motion'}).click();
 await page.getByLabel('LAUNCH SPEED',{exact:true}).fill('14');
 await page.getByLabel('LAUNCH ANGLE',{exact:true}).fill('45');
 await page.getByText('CHALLENGE COMPLETE').waitFor();
 await page.getByRole('link',{name:'Token Economics course'}).click();
 assert.ok(page.url().includes('/course/'));
 assert.deepEqual(errors,[]);
 console.log('STEM browser: three 3D lessons, live controls, challenges, pause, course route passed');
}finally{await browser.close()}

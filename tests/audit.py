# OPTIONAL real-browser audit. Needs: pip install playwright; playwright install chromium; npm i axe-core (in /tmp); node serve.js running.
import json, sys, glob, os
from playwright.sync_api import sync_playwright
B='http://localhost:8080/'; AXE=open('/tmp/node_modules/axe-core/axe.min.js').read(); fails=[]; errs=[]
def chk(name,cond):
    print(('PASS ' if cond else 'FAIL ')+name); (not cond) and fails.append(name)
pages=['']+[os.path.relpath(f,'dist').replace('index.html','') for f in sorted(glob.glob('dist/**/index.html',recursive=True)) if f!='dist/index.html']
with sync_playwright() as p:
    b=p.chromium.launch()
    for label,vp in (('desktop',{'width':1280,'height':900}),('mobile',{'width':390,'height':844})):
        ctx=b.new_context(viewport=vp); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
        for u in pages:
            pg.goto(B+u); pg.add_script_tag(content=AXE)
            r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','best-practice']})")
            v=[(x['id'],x['impact'],len(x['nodes'])) for x in r['violations']]
            ow=pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
            chk('%s /%s axe violations=%s'%(label,u,v or 0), not v); chk('%s /%s no horizontal scroll'%(label,u), not ow)
        if label=='desktop': pg.goto(B); pg.screenshot(path='/tmp/home-desktop.png'); 
        else: pg.goto(B); pg.screenshot(path='/tmp/home-mobile.png')
    # reset buttons + imperial toggles on every calculator
    ctx=b.new_context(); pg=ctx.new_page()
    for slug,fill in {'healthy-weight':{'age':'30','cm':'170'},'bmi-calculator':{'age':'30','cm':'170','weight':'70'},'waist-to-height':{'cm':'170','waist':'80'},'protein-calculator':{'weight':'70'},'weight-progress':{'start':'80','current':'78','d1':'2026-01-01','d2':'2026-02-01'}}.items():
        pg.goto(B+slug+'/')
        for k,v in fill.items(): pg.fill('form.tool [name=%s]'%k,v)
        pg.click('form.tool button[type=submit]'); shown=pg.inner_text('form.tool .result').strip()!=''
        pg.click('form.tool button[type=reset]'); pg.wait_for_timeout(50)
        cleared=pg.inner_text('form.tool .result').strip()=='' and all(pg.input_value('form.tool [name=%s]'%k) in ('','30') or k=='age' and False for k in [] )
        vals=[pg.input_value('form.tool [name=%s]'%k) for k in fill if k not in('d1','d2')]
        chk('%s reset clears result and fields'%slug, shown and cleared and all(v=='' for v in vals))
    pg.goto(B+'bmi-calculator/'); pg.select_option('#units','imperial')
    chk('imperial shows ft/in and hides cm', pg.is_visible('[name=ft]') and not pg.is_visible('[name=cm]'))
    pg.fill('[name=age]','30'); pg.fill('[name=ft]','5'); pg.fill('[name=in]','10'); pg.fill('[name=weight]','180'); pg.click('form.tool button[type=submit]')
    chk('BMI 5ft10in/180lb = 25.8', '25.8' in pg.inner_text('.result'))
    pg.goto(B+'protein-calculator/'); pg.select_option('#wunit','lb'); pg.fill('[name=weight]','200'); pg.select_option('#goal','active'); pg.click('form.tool button[type=submit]'); t=pg.inner_text('.result')
    chk('protein 200lb active = 91-109 g', '91 – 109 g' in t)
    # tracker: corrupted storage + CSV content + persistence across reload
    ctx2=b.new_context(accept_downloads=True); pg=ctx2.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(B+'body-measurements/'); pg.evaluate("localStorage.setItem('bmg_records_v1', JSON.stringify([{id:'x',date:'bad'},null,{id:'y',date:'2026-01-01',weightKg:'abc'},{id:'z',date:'2026-01-02',weightKg:80,waistCm:90,hipsCm:100,chestCm:105}]))"); pg.reload()
    chk('corrupted storage: only valid record shown, no crash', pg.locator('#rec-list tr').count()==1)
    pg.evaluate("localStorage.setItem('bmg_records_v1','{not json')"); pg.reload(); chk('invalid JSON storage handled', pg.locator('#rec-list tr').count()==0 and pg.is_visible('#latest'))
    for d,w in (('2026-03-01','81.5'),('2026-03-08','80.9')):
        pg.fill('[name=date]',d); pg.fill('[name=weight]',w); pg.fill('[name=waist]','90'); pg.fill('[name=hips]','100'); pg.fill('[name=chest]','105'); pg.fill('[name=notes]','=SUM(1,1)' if d=='2026-03-01' else ''); pg.click('#save-btn')
    pg.reload(); chk('records persist after reload', pg.locator('#rec-list tr').count()==2)
    with pg.expect_download() as dl: pg.click('#export-btn')
    path=dl.value.path(); csv=open(path,encoding='utf-8-sig').read()
    chk('CSV header + formula guard', csv.startswith('"Date","Weight (kg)"') and '"\'=SUM(1,1)"' in csv and '81.5' in csv)
    pg.on('dialog',lambda d:d.accept()); pg.click('#clear-btn'); pg.wait_for_timeout(100)
    chk('clear all empties list and storage', pg.locator('#rec-list tr').count()==0 and json.loads(pg.evaluate("localStorage.getItem('bmg_records_v1')"))==[])
    # keyboard: skip link is first focusable
    pg.goto(B); pg.keyboard.press('Tab'); chk('first Tab focuses skip link', pg.evaluate("document.activeElement.className")=='skip')
    b.close()
print('console/page errors:',errs); chk('no console errors', not errs)
print('FAILED:',fails) if fails else print('ALL PASSED'); sys.exit(1 if fails else 0)

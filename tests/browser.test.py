# OPTIONAL real-browser test (needs: pip install playwright && playwright install chromium; run `node serve.js` first)
import sys
from playwright.sync_api import sync_playwright
B='http://localhost:8080/'; errs=[]; res={}
CASES={'healthy-weight':({'age':'40','cm':'170'},'53.5 – 72.0 kg'),
'bmi-calculator':({'age':'30','cm':'175','weight':'70'},'22.9'),
'waist-to-height':({'cm':'170','waist':'96.5'},'0.57'),
'protein-calculator':({'weight':'70'},'56 g'),
'weight-progress':({'start':'80','current':'76','goal':'72','d1':'2026-01-01','d2':'2026-01-29'},'-4.0 kg'),
}
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp in (('desktop',{'width':1280,'height':900}),('mobile',{'width':390,'height':844})):
        pg=b.new_context(viewport=vp).new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
        for slug,(vals,expect) in CASES.items():
            pg.goto(B+slug+'/')
            for k,v in vals.items(): pg.fill('form.tool [name=%s]'%k,v)
            pg.click('form.tool button[type=submit]'); txt=pg.inner_text('form.tool .result')
            ow=pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
            res[(name,slug)]=(expect in txt, not ow); 
            if slug in('bmi-calculator','waist-to-height','weight-progress'): pg.screenshot(path='/tmp/%s-%s.png'%(name,slug),full_page=False)
        pg.goto(B+'body-measurements/')
        for k,v in {'weight':'80','waist':'90','hips':'100','chest':'105'}.items(): pg.fill('form[data-tracker] [name=%s]'%k,v)
        pg.click('#save-btn'); pg.fill('form[data-tracker] [name=date]','2026-02-01'); [pg.fill('form[data-tracker] [name=%s]'%k,v) for k,v in {'weight':'79','waist':'89','hips':'99','chest':'104'}.items()]; pg.click('#save-btn')
        assert not pg.is_visible('#cancel-edit'), 'cancel-edit should be hidden'
        ok=pg.locator('#rec-list tr').count()==2 and pg.locator('#chart polyline').count()==1
        ow=pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth'); res[(name,'tracker')]=(ok,not ow)
        pg.screenshot(path='/tmp/%s-tracker.png'%name,full_page=True)
        # content width on desktop
        if name=='desktop': print('wrap width', pg.evaluate("document.querySelector('.wrap').getBoundingClientRect().width"))
    b.close()
bad=[k for k,v in res.items() if not all(v)]
for k,v in res.items(): print(k,'result ok' if v[0] else 'RESULT FAIL','no-h-scroll' if v[1] else 'H-SCROLL')
print('console/page errors:',errs); sys.exit(1 if bad or errs else 0)

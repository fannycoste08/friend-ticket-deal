import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True)
        pg=await (await b.new_context(viewport={"width":393,"height":844})).new_page()
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
        await pg.goto("http://localhost:8080/musica"); await pg.wait_for_timeout(5000)
        await pg.screenshot(path="top.png")
        await pg.get_by_role("link",name="Discos").click(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path="discos.png")
        print("rows",await pg.locator("#conciertos tbody tr").count(),"sw",await pg.evaluate("document.documentElement.scrollWidth"),errs)
        await b.close()
asyncio.run(main())

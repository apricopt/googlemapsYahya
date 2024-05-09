const puppeteer = require("puppeteer");
const { sleep } = require("./utils");
const { writeCsvFile } = require("./csvHelper");
const { configuration } = require("./config");

const readline = require("readline-sync");

async function lanchProcess() {
  const searchItem = readline.question("Give Search Keyword ?\n");
  let args = ["--no-sandbox"];
  if (configuration.useProxy)
    args.push(
      `--proxy-server=${configuration.proxySettings.address}:${configuration.proxySettings.port}`
    );
  const browser = await puppeteer.launch({
    headless: configuration.headless, // Adjust based on your preference
    ignoreHTTPSErrors: true,
    args,
  });

  try {
    const page = await browser.newPage();
    // await page.setViewport({
    //   width: 2920,
    //   height: 4080,
    // });
    if (configuration.useProxy) {
      await page.authenticate({
        username: configuration.proxySettings.username,
        password: configuration.proxySettings.password,
      });
    }
    // await page.goto('https://www.whatismyip.com/');
    // await page.screenshot({ path: 'example.png' });
    await page.setDefaultNavigationTimeout(0);
    page.on("console", (msg) => console.log(msg.text()));

    await page.goto("https://www.google.com/maps");
    await page.type("#searchboxinput", `${searchItem}`);
    await page.keyboard.press("Enter");

    // now we are on google map

    await sleep(6000);
    // scrolling upto bottom starts
    let LinksToOpen = await page.evaluate(
      async ({ searchItem }) => {
        const sleep = (ms) => {
          return new Promise((resolve) => setTimeout(resolve, ms));
        };

        const b = document.querySelector(
          `[aria-label="Results for ${searchItem}"]`
        );

        console.log("search ", searchItem);
        console.log("b +> ", b);

        const scrollHeight = b.scrollHeight;
        const clientHeight = b.clientHeight;
        const offsetFromBottom = 3000000000;
        const targetScrollPosition =
          scrollHeight - clientHeight + offsetFromBottom;

        let scroll = async () => {
          console.log("⏱️ Scrolling >>> to load all records please be wait ⏱️");
          for (let i = 0; i < 60; i++) {
            await sleep(1000);
            console.log(`${60 - i} seconds left to finish scrolling 🍒`);
            b.scrollTop = targetScrollPosition;
          }
        };

        await scroll();

        const linkToDetailSelector = "a.hfpxzc";

        let linksElements = document.querySelectorAll(linkToDetailSelector);
        let linksArray = Array.from(linksElements);
        let links = linksArray.map((item) => item.href);

        return links.length ? links : [];
      },
      { searchItem }
    );

    //scrolling upto bottom ends

    // console.log("These are links ", LinksToOpen);

    let finalData = [];

    for (let i = 0; i < LinksToOpen.length; i++) {
      let url = LinksToOpen[i];
      await sleep(500);
      const detailPage = await browser.newPage();
      await detailPage.goto(url, { timeout: 60000 });

      console.log(
        ` 🧨 Scanning ---> Link number ${i + 1}/${LinksToOpen.length}`
      );
      let pageInfo = await detailPage.evaluate(() => {
        try {
          let title = document.querySelector("h1.DUwDvf.lfPIob").innerText;
          let websiteLink = document.querySelector(
            '[data-tooltip="Open website"]'
          );
          let link = websiteLink.href;
          linkOfWebsite = link;

          return { title, linkOfWebsite };
        } catch (err) {
          console.log(err);

          return {};
        }
      });

      await detailPage.close();

      console.log("💫 Hotel Info 🔸 ", pageInfo);

      if (pageInfo.linkOfWebsite) {
        finalData.push(pageInfo);
      }
    }

    await writeCsvFile(finalData, `csvResults/${searchItem}.csv`);

    await browser.close();
  } catch (err) {
    console.log("FinalError ", err);
    await browser.close();
  }
}

lanchProcess();

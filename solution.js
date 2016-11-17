"use strict"

const Promise = require("bluebird");

const fs = Promise.promisifyAll(require("fs"));
const cheerio = require("cheerio");
const request = Promise.promisifyAll(require("request"), {
    multiArgs: true
});

let scaper = function() {
    let json = {},
        categoryNames = [],
        categoryUrls = [],
        home = "https://m.bnizona.com/index.php/category/index/promo";

    request.getAsync(home)
        .then(function (result) {
            let body = result[0].body,
                $ = cheerio.load(body);

            $("ul[class=menu]").children("li").each(function (i, elem) {
                let name = $(this).text().replace(/\s/g, " ").trim(),
                    url = $(this).children("a").attr("href");

                categoryNames.push(name);
                categoryUrls.push(url);
                json[name] = [];
            });

            for (let i = 0, len = categoryUrls.length; i < len; i++) {
                request.getAsync(categoryUrls[i])
                    .then(function (result) {
                        let body = result[0].body,
                            $ = cheerio.load(body),
                            categoryDetails = [];

                        $("ul[class=list2]").children("li").each(function (i, elem) {
                            let imageUrl = $(this).children("a").children("img").attr("src"),
                                merchantName = $(this).children("a").children("span").eq(0).text(),
                                promoTitle = $(this).children("a").children("span").eq(1).text(),
                                validUntil = $(this).children("a").children("span").eq(2).text();

                            let detail = {
                                imageUrl: imageUrl,
                                merchantName: merchantName,
                                promoTitle: promoTitle,
                                validUntil: validUntil
                            };

                            categoryDetails.push(detail);
                        });

                        json[categoryNames[i]] = categoryDetails;

                        fs.writeFile("solution.json", JSON.stringify(json), (err) => {
                            if (err) throw err;
                            console.log('It\'s saved!');
                        });
                    })
                    .catch(function (error) {
                        console.log("Error", error);
                    });
            }

        })
        .catch(function (error) {
            console.log("Error", error);
            res.send({
                result: error
            })
        });
};

module.exports = scaper();
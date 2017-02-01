"use strict";
var jsdom = require("jsdom");
var html = "<!DOCTYPE html><html><p id='x'>Some text.</html>";
jsdom.env(html, go);

function go(err, window) {
    console.log(window.document);
}

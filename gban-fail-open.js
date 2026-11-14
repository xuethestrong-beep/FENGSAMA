// gban-fail-open.js
"use strict";
const Module = require("module");
const path = require("path");
const utilsPath = path.resolve(__dirname, "utils.js");
const originalLoad = Module._load;
let fallbackInstalled = false;
Module._load = function loadWithGbanFallback(request, parent, isMain) {
  if (fallbackInstalled) {
    return originalLoad.call(this, request, parent, isMain);
  }
  let resolvedPath = null;
  if (parent?.filename) {
    try {
      resolvedPath = Module._resolveFilename(request, parent, isMain);
    } catch (_) {}
  }
  const exports = originalLoad.call(this, request, parent, isMain);
  if (resolvedPath !== utilsPath) {
    return exports;
  }
  const getGbanList = exports?.STBotApis?.prototype?.getGbanList;
  if (typeof getGbanList !== "function") {
    return exports;
  }
  exports.STBotApis.prototype.getGbanList = async function getGbanListWithFallback(...args) {
    try {
      const result = await getGbanList.apply(this, args);
      if (result !== null && result !== undefined) {
        return result;
      }
    } catch (err) {
      console.warn("[GBAN FAIL-OPEN] STBot API error, continuing without global-ban verification:", err.message);
      return { success: true, data: [] };
    }
    console.warn("[GBAN FAIL-OPEN] STBot API unavailable (null), continuing without global-ban verification.");
    return { success: true, data: [] };
  };
  fallbackInstalled = true;
  Module._load = originalLoad;
  return exports;
};

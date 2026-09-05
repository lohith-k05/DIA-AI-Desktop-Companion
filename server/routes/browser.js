import express from "express";
import * as browserService from "../services/browserService.js";

const router = express.Router();

router.post("/task", async (req, res) => {
  try {
    const result = await browserService.executeTask(req.body.prompt);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/open", async (req, res) => {
  try {
    const result = await browserService.openUrl(req.body.url);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/search", async (req, res) => {
  try {
    const result = await browserService.searchWeb(req.body.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/read", async (req, res) => {
  try {
    const result = await browserService.readPage();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/click", async (req, res) => {
  try {
    const result = await browserService.clickElement(req.body.selector);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/fill", async (req, res) => {
  try {
    const result = await browserService.fillForm(req.body.selector, req.body.value);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/navigate", async (req, res) => {
  try {
    const result = await browserService.navigatePage(req.body.action, req.body.url);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/stop", async (req, res) => {
  try {
    const result = await browserService.stopTask();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const result = await browserService.getStatus();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

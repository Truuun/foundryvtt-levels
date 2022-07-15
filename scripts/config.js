import { injectConfig } from "./lib/injectConfig.js";
import { TileHandler } from './handlers/tileHandler.js';
import { RefreshHandler } from './handlers/refreshHandler.js';
import { StairHandler } from "./handlers/stairHandler.js";
import { BasicHandler } from "./handlers/basicHandler.js";
import { SightHandler } from "./handlers/sightHandler.js";
import { registerWrappers } from './wrappers.js';

Object.defineProperty(TileDocument.prototype, "elevation", {
  get: function () {
    return this.flags?.levels?.rangeBottom ?? Infinity;
  }
});

Hooks.on("init", () => {
  CONFIG.Levels = {
    MODULE_ID: "levels"
  }
  CONFIG.Levels.handlers = {
      TileHandler,
      RefreshHandler,
      StairHandler,
      BasicHandler,
      SightHandler
  }

  Hooks.callAll("levelsConfigReady", CONFIG.Levels);

  registerWrappers();

})

Hooks.once("ready", () => {
  // Module title
  const MODULE_ID = CONFIG.Levels.MODULE_ID;
  const MODULE_TITLE = game.modules.get(MODULE_ID).data.title;

  const FALLBACK_MESSAGE_TITLE = MODULE_TITLE;
  const FALLBACK_MESSAGE = `<large>
  <p><strong>This module may be very complicated for a first timer, be sure to stop by my <a href="https://theripper93.com/">Discord</a> for help and support from the wonderful community as well as many resources</strong></p>

  <p>Thanks to all the patreons supporting the development of this module making continued updates possible!</p>
  <p>If you want to support the development of the module or get customized support in setting up your maps you can do so here : <a href="https://www.patreon.com/theripper93">Patreon</a> </p></large>
  <p><strong>Patreons</strong> get also access to <strong>15+ premium modules</strong></p>
  <p>Is Levels not enough? Go Full 3D</p>
  <h1>3D Canvas</h1>
  <iframe width="385" height="225" src="https://www.youtube.com/embed/hC1QGZFUhcU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  <p>Check 3D Canvas and all my other <strong>15+ premium modules <a href="https://theripper93.com/">Here</a></strong></p>
  <p>Special thanks to Baileywiki for the support and feedback and Blair for the amazing UI elements</p>`;

  // Settings key used for the "Don't remind me again" setting
  const DONT_REMIND_AGAIN_KEY = "popup-dont-remind-again-2";

  // Dialog code
  game.settings.register(MODULE_ID, DONT_REMIND_AGAIN_KEY, {
    name: "",
    default: false,
    type: Boolean,
    scope: "world",
    config: false,
  });
  if (game.user.isGM && !game.settings.get(MODULE_ID, DONT_REMIND_AGAIN_KEY)) {
    new Dialog({
      title: FALLBACK_MESSAGE_TITLE,
      content: FALLBACK_MESSAGE,
      buttons: {
        ok: { icon: '<i class="fas fa-check"></i>', label: "Understood" },
        dont_remind: {
          icon: '<i class="fas fa-times"></i>',
          label: "Don't remind me again",
          callback: () =>
            game.settings.set(MODULE_ID, DONT_REMIND_AGAIN_KEY, true),
        },
      },
    }).render(true);
  }
});

Hooks.on("init", () => {
  game.settings.register(CONFIG.Levels.MODULE_ID, "tokenElevScale", {
    name: game.i18n.localize("levels.settings.tokenElevScale.name"),
    hint: game.i18n.localize("levels.settings.tokenElevScale.name"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (setting) => {
      _levels.elevationScale = setting;
      _levels.updateScales();
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "tokenElevScaleMultiSett", {
    name: game.i18n.localize("levels.settings.tokenElevScaleMultiSett.name"),
    hint: game.i18n.localize("levels.settings.tokenElevScaleMultiSett.hint"),
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: (setting) => {
      _levels.tokenElevScaleMultiSett = setting;
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "fogHiding", {
    name: game.i18n.localize("levels.settings.fogHiding.name"),
    hint: game.i18n.localize("levels.settings.fogHiding.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (setting) => {
      _levels.fogHiding = setting;
      _levels._onElevationChangeUpdate();
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "revealTokenInFog", {
    name: game.i18n.localize("levels.settings.revealTokenInFog.name"),
    hint: game.i18n.localize("levels.settings.revealTokenInFog.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (setting) => {
      _levels.revealTokenInFog = setting;
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "lockElevation", {
    name: game.i18n.localize("levels.settings.lockElevation.name"),
    hint: game.i18n.localize("levels.settings.lockElevation.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "hideElevation", {
    name: game.i18n.localize("levels.settings.hideElevation.name"),
    hint: game.i18n.localize("levels.settings.hideElevation.hint"),
    scope: "world",
    config: true,
    type: Number,
    choices: {
      0: game.i18n.localize("levels.settings.hideElevation.opt0"),
      1: game.i18n.localize("levels.settings.hideElevation.opt1"),
      2: game.i18n.localize("levels.settings.hideElevation.opt2"),
    },
    default: 0,
    onChange: (setting) => {
      _levels.hideElevation = setting;
      canvas.tokens.placeables.forEach((t) => t.refresh());
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "enableTooltips", {
    name: game.i18n.localize("levels.settings.enableTooltips.name"),
    hint: game.i18n.localize("levels.settings.enableTooltips.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "preciseTokenVisibility", {
    name: game.i18n.localize("levels.settings.preciseTokenVisibility.name"),
    hint: game.i18n.localize("levels.settings.preciseTokenVisibility.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (setting) => {
      _levels.preciseTokenVisibility = setting;
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "exactTokenVisibility", {
    name: game.i18n.localize("levels.settings.exactTokenVisibility.name"),
    hint: game.i18n.localize("levels.settings.exactTokenVisibility.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (setting) => {
      _levels.exactTokenVisibility = setting;
    },
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "forceUiRefresh", {
    name: game.i18n.localize("levels.settings.forceUiRefresh.name"),
    hint: game.i18n.localize("levels.settings.forceUiRefresh.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(CONFIG.Levels.MODULE_ID, "debugRaycast", {
    name: game.i18n.localize("levels.settings.debugRaycast.name"),
    hint: game.i18n.localize("levels.settings.debugRaycast.hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (setting) => {
      _levels.RAYS = setting;
    },
  });
});

Hooks.on("renderTileConfig", (app, html, data) => {
  const isInjected = html.find(`input[name="flags.${CONFIG.Levels.MODULE_ID}.rangeTop"]`).length > 0;
  if(isInjected) return;

  const injHtml = injectConfig.inject(app, html, {
    "moduleId": "levels",
        "tab" : {
            "name": "levels",
            "label": "Levels",
            "icon": "fas fa-layer-group",
        },
        "noOverheadWarning": {
          type: "custom",
          html: `<p class="notes" id="no-overhead-warning" style="color: red;">${game.i18n.localize("levels.tilecoonfig.noOverhead")}</p>`,
        },
        "rangeTop": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeTop.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
        "rangeBottom": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeBottom.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: -Infinity,
        },
        "showIfAbove": {
          type: "checkbox",
          label: game.i18n.localize("levels.tilecoonfig.showIfAbove.name"),
          notes: game.i18n.localize("levels.tilecoonfig.showIfAbove.hint"),
        },
        "showAboveRange": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.showAboveRange.name"),
          notes: game.i18n.localize("levels.tilecoonfig.showAboveRange.hint"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
        "isBasement": {
          type: "checkbox",
          label: game.i18n.localize("levels.tilecoonfig.isBasement.name"),
          notes: game.i18n.localize("levels.tilecoonfig.isBasement.hint"),
        },
        "noFogHide": {
          type: "checkbox",
          label: game.i18n.localize("levels.tilecoonfig.noFogHide.name"),
          notes: game.i18n.localize("levels.tilecoonfig.noFogHide.hint"),
        },
        "excludeFromChecker": {
          type: "checkbox",
          label: game.i18n.localize("levels.tilecoonfig.excludeFromChecker.name"),
        },
  });
  html.on("change", "input", (e) => {
    const isOverhead = html.find(`input[name="overhead"]`).is(":checked");
    const isShowIfAbove = injHtml.find(`input[name="flags.levels.showIfAbove"]`).is(":checked");
    injHtml.find("input").prop("disabled", !isOverhead);
    injHtml.find("input[name='flags.levels.showAboveRange']").closest(".form-group").toggle(isShowIfAbove);
    html.find("#no-overhead-warning").toggle(!isOverhead);
    app.setPosition({ height: "auto" });
  })
  html.find(`input[name="overhead"]`).trigger("change");
  app.setPosition({ height: "auto" });
});

Hooks.on("renderAmbientLightConfig", (app, html, data) => {
  const injHtml = injectConfig.inject(app, html, {
    "moduleId": "levels",
        "inject": 'input[name="config.dim"]',
        "rangeTop": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeTop.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
        "rangeBottom": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeBottom.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: -Infinity,
        },
  });
});

Hooks.on("renderNoteConfig", (app, html, data) => {
  const injHtml = injectConfig.inject(app, html, {
    "moduleId": "levels",
        "inject": 'select[name="textAnchor"]',
        "rangeTop": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeTop.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
        "rangeBottom": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeBottom.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: -Infinity,
        },
  });
});

Hooks.on("renderAmbientSoundConfig", (app, html, data) => {
  const injHtml = injectConfig.inject(app, html, {
    "moduleId": "levels",
        "inject": 'input[name="radius"]',
        "rangeTop": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeTop.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
        "rangeBottom": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeBottom.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: -Infinity,
        },
  });
});

Hooks.on("renderDrawingConfig", (app, html, data) => {

  const injHtml = injectConfig.inject(app, html, {
    "moduleId": "levels",
        "inject": 'input[name="z"]',
        "drawingMode": {
          type: "select",
          label: game.i18n.localize("levels.drawingconfig.isHole.name"),
          default: 0,
          dType: "Number",
          options: {
            0 : game.i18n.localize("levels.drawingconfig.isHole.opt0"),
            1 : game.i18n.localize("levels.drawingconfig.isHole.opt1"),
            2 : game.i18n.localize("levels.drawingconfig.isHole.opt2"),
            3 : game.i18n.localize("levels.drawingconfig.isHole.opt3"),
          }
        },
        "elevatorFloors": {
          type: "text",
          label: game.i18n.localize("levels.drawingconfig.elevatorFloors.name"),
          notes: game.i18n.localize("levels.drawingconfig.elevatorFloors.hint"),
        },
        "rangeTop": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeTop.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
        "rangeBottom": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.tilecoonfig.rangeBottom.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: -Infinity,
        },
  });
});

Hooks.on("renderMeasuredTemplateConfig", (app, html, data) => {
  const injHtml = injectConfig.inject(app, html, {
    "moduleId": "levels",
        "inject": 'input[name="width"]',
        "elevation": {
          type: "text",
          dType: "Number",
          label: game.i18n.localize("levels.template.elevation.name"),
          units: game.i18n.localize("levels.tilecoonfig.range.unit"),
          default: Infinity,
        },
  });
});

Hooks.on("renderDrawingHUD", (data, hud, drawData) => {
  let drawing = data.object.document;
  if (drawing.getFlag(CONFIG.Levels.MODULE_ID, "drawingMode")) {
    let active = drawing.getFlag(CONFIG.Levels.MODULE_ID, "stairLocked") || false;
    let toggleStairbtn = `<div class="control-icon${
      active ? " active" : ""
    }" id="toggleStair">
              <i class="fas fa-lock" width="36" height="36" title='${game.i18n.localize(
                "levels.drawingHud.title"
              )}'></i>
                              </div>`;
    const controlIcons = hud.find("div.control-icon");
    controlIcons.last().after(toggleStairbtn);
    $(hud.find(`div[id="toggleStair"]`)).on("click", test);
    function test() {
      console.log("test");
      active = !active;
      drawing.setFlag(
        CONFIG.Levels.MODULE_ID,
        "stairLocked",
        !(drawing.getFlag(CONFIG.Levels.MODULE_ID, "stairLocked") || false)
      );
      let hudbtn = hud.find(`div[id="toggleStair"]`);
      if (active) hudbtn.addClass("active");
      else hudbtn.removeClass("active");
    }
  }
});

Hooks.on("renderTokenHUD", (data, hud, drawData) => {
  if (
    game.settings.get(CONFIG.Levels.MODULE_ID, "lockElevation") &&
    !game.user.isGM
  ) {
    const controlIcons = hud.find(`div[class="attribute elevation"]`);
    $(controlIcons[0]).remove();
  }
});

Hooks.on("preCreateMeasuredTemplate", (template) => {
  const templateData = _levels.getTemplateData();
  if(template.data.flags?.levels?.elevation) return;
  template.data.update({
    flags: { levels: { elevation: templateData.elevation, special: templateData.special } },
  });
});
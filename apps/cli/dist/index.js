#!/usr/bin/env node
import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../../node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// ../../node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.endsWith("...")) {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// ../../node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (option.description) {
          return `${option.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatItemList(heading, items, helper) {
      if (items.length === 0)
        return [];
      return [helper.styleTitle(heading), ...items, ""];
    }
    groupItems(unsortedItems, visibleItems, getGroup) {
      const result = new Map;
      unsortedItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group))
          result.set(group, []);
      });
      visibleItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group)) {
          result.set(group, []);
        }
        result.get(group).push(item);
      });
      return result;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        ""
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
      });
      output = output.concat(this.formatItemList("Arguments:", argumentList, helper));
      const optionGroups = this.groupItems(cmd.options, helper.visibleOptions(cmd), (option) => option.helpGroupHeading ?? "Options:");
      optionGroups.forEach((options2, group) => {
        const optionList = options2.map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        output = output.concat(this.formatItemList(group, optionList, helper));
      });
      if (helper.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        output = output.concat(this.formatItemList("Global Options:", globalOptionList, helper));
      }
      const commandGroups = this.groupItems(cmd.commands, helper.visibleCommands(cmd), (sub) => sub.helpGroup() || "Commands:");
      commandGroups.forEach((commands, group) => {
        const commandList = commands.map((sub) => {
          return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(sub)), helper.styleSubcommandDescription(helper.subcommandDescription(sub)));
        });
        output = output.concat(this.formatItemList(group, commandList, helper));
      });
      return output.join(`
`);
    }
    displayWidth(str) {
      return stripColor(str).length;
    }
    styleTitle(str) {
      return str;
    }
    styleUsage(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word === "[command]")
          return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word);
      }).join(" ");
    }
    styleCommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleOptionDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleSubcommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleArgumentDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleDescriptionText(str) {
      return str;
    }
    styleOptionTerm(str) {
      return this.styleOptionText(str);
    }
    styleSubcommandTerm(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word);
      }).join(" ");
    }
    styleArgumentTerm(str) {
      return this.styleArgumentText(str);
    }
    styleOptionText(str) {
      return str;
    }
    styleArgumentText(str) {
      return str;
    }
    styleSubcommandText(str) {
      return str;
    }
    styleCommandText(str) {
      return str;
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    preformatted(str) {
      return /\n[^\S\r\n]/.test(str);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = " ".repeat(itemIndent);
      if (!description)
        return itemIndentStr + term;
      const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(/\n/g, `
` + " ".repeat(termWidth + spacerWidth));
      }
      return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
    }
    boxWrap(str, width) {
      if (width < this.minWidthToWrap)
        return str;
      const rawLines = str.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push("");
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(""));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(""));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str.replace(sgrPattern, "");
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// ../../node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
      this.helpGroupHeading = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      return camelcase(this.name());
    }
    helpGroup(heading) {
      this.helpGroupHeading = heading;
      return this;
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options2) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options2.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat("guard");
    if (shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0]))
      longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith("-")) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(`option creation failed due to no flags found in '${flags}'.`);
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// ../../node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// ../../node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("node:events").EventEmitter;
  var childProcess = __require("node:child_process");
  var path = __require("node:path");
  var fs = __require("node:fs");
  var process2 = __require("node:process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        outputError: (str, write) => write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str) => stripColor(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
      this._helpGroupHeading = undefined;
      this._defaultCommandGroup = undefined;
      this._defaultOptionGroup = undefined;
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      this._outputConfiguration = {
        ...this._outputConfiguration,
        ...configuration
      };
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, parseArg, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof parseArg === "function") {
        argument.default(defaultValue).argParser(parseArg);
      } else {
        argument.default(parseArg);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument?.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        if (enableOrNameAndArgs && this._defaultCommandGroup) {
          this._initCommandGroup(this._getHelpCommand());
        }
        return this;
      }
      const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      if (enableOrNameAndArgs || description)
        this._initCommandGroup(helpCommand);
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      this._initCommandGroup(helpCommand);
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {}
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this._initOptionGroup(option);
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this._initCommandGroup(command);
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._collectValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources }
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile))
        return;
      const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise?.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent?.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(args) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      const negativeNumberArg = (arg) => {
        if (!/^-\d*\.?\d+(e[+-]?\d+)?$/.test(arg))
          return false;
        return !this._getCommandAndAncestors().some((cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short)));
      };
      let activeVariadicOption = null;
      let activeGroup = null;
      let i = 0;
      while (i < args.length || activeGroup) {
        const arg = activeGroup ?? args[i++];
        activeGroup = null;
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args.slice(i));
          break;
        }
        if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args[i++];
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
                value = args[i++];
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              activeGroup = `-${arg.slice(2)}`;
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            unknown.push(...args.slice(i));
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg, ...args.slice(i));
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg, ...args.slice(i));
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg, ...args.slice(i));
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    helpGroup(heading) {
      if (heading === undefined)
        return this._helpGroupHeading ?? "";
      this._helpGroupHeading = heading;
      return this;
    }
    commandsGroup(heading) {
      if (heading === undefined)
        return this._defaultCommandGroup ?? "";
      this._defaultCommandGroup = heading;
      return this;
    }
    optionsGroup(heading) {
      if (heading === undefined)
        return this._defaultOptionGroup ?? "";
      this._defaultOptionGroup = heading;
      return this;
    }
    _initOptionGroup(option) {
      if (this._defaultOptionGroup && !option.helpGroupHeading)
        option.helpGroup(this._defaultOptionGroup);
    }
    _initCommandGroup(cmd) {
      if (this._defaultCommandGroup && !cmd.helpGroup())
        cmd.helpGroup(this._defaultCommandGroup);
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors)
        return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str) => this._outputConfiguration.writeErr(str);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str) => this._outputConfiguration.writeOut(str);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str) => {
        if (!hasColors)
          str = this._outputConfiguration.stripColor(str);
        return baseWrite(str);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this
      };
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
      this.emit("beforeHelp", eventContext);
      let helpInformation = this.helpInformation({ error: outputContext.error });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", eventContext);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          if (this._helpOption === null)
            this._helpOption = undefined;
          if (this._defaultOptionGroup) {
            this._initOptionGroup(this._getHelpOption());
          }
        } else {
          this._helpOption = null;
        }
        return this;
      }
      this._helpOption = this.createOption(flags ?? "-h, --help", description ?? "display help for command");
      if (flags || description)
        this._initOptionGroup(this._helpOption);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      this._initOptionGroup(option);
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// ../../node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// src/commands/base-command.ts
class BaseCommand {
  options;
  config = null;
  constructor(options2) {
    this.options = options2;
  }
  async loadConfig() {
    throw new Error("loadConfig must be implemented by subclass");
  }
  log(message, level = "info") {
    if (this.options.quiet && level !== "error") {
      return;
    }
    const timestamp = new Date().toISOString();
    const prefix = level === "error" ? "ERROR" : level === "warn" ? "WARN" : "INFO";
    process.stdout.write(`[${timestamp}] ${prefix}: ${message}
`);
  }
  logVerbose(message) {
    if (this.options.verbose) {
      this.log(message);
    }
  }
  formatOutput(data) {
    if (this.options.json) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  }
}

// ../../node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set;
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
}, createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
var init_vanilla = () => {};

// ../../node_modules/zustand/esm/react.mjs
import React from "react";
function useStore(api, selector = identity) {
  const slice = React.useSyncExternalStore(api.subscribe, React.useCallback(() => selector(api.getState()), [api, selector]), React.useCallback(() => selector(api.getInitialState()), [api, selector]));
  React.useDebugValue(slice);
  return slice;
}
var identity = (arg) => arg, createImpl = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  Object.assign(useBoundStore, api);
  return useBoundStore;
}, create = (createState) => createState ? createImpl(createState) : createImpl;
var init_react = __esm(() => {
  init_vanilla();
});

// ../../node_modules/zustand/esm/index.mjs
var init_esm = __esm(() => {
  init_vanilla();
  init_react();
});

// ../../packages/core/src/plugins/plugin-loader.ts
var exports_plugin_loader = {};
__export(exports_plugin_loader, {
  PluginLoader: () => PluginLoader
});

class PluginLoader {
  logger;
  loadedPlugins = new Map;
  constructor(logger) {
    this.logger = logger;
  }
  async loadPlugin(pluginPath) {
    try {
      const module = await import(pluginPath);
      const PluginClass = module.default || module.AnalysisPlugin;
      if (!PluginClass) {
        throw new Error(`No default export found in ${pluginPath}`);
      }
      const plugin = new PluginClass;
      if (!this.isValidPlugin(plugin)) {
        throw new Error(`Invalid plugin: missing required methods or properties`);
      }
      this.loadedPlugins.set(plugin["name"], plugin);
      this.logger.info(`Loaded plugin: ${plugin["name"]} v${plugin["version"]} from ${pluginPath}`);
      return plugin;
    } catch (error) {
      this.logger.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw new Error(`Plugin loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async loadPlugins(pluginPaths) {
    const plugins = [];
    for (const path of pluginPaths) {
      try {
        const plugin = await this.loadPlugin(path);
        plugins.push(plugin);
      } catch (error) {
        this.logger.warn(`Skipping plugin from ${path}:`, error);
      }
    }
    this.logger.info(`Loaded ${plugins.length} out of ${pluginPaths.length} plugins`);
    return plugins;
  }
  async discoverPlugins(directory) {
    const { readdir, stat } = await import("fs/promises");
    const { join: join5 } = await import("path");
    try {
      const entries = await readdir(directory);
      const pluginPaths = [];
      for (const entry of entries) {
        const fullPath = join5(directory, entry);
        const stats = await stat(fullPath);
        if (stats.isFile() && this.isPluginFile(entry)) {
          pluginPaths.push(fullPath);
        } else if (stats.isDirectory()) {
          const subDirFiles = await readdir(fullPath);
          const mainFile = subDirFiles.find((file) => file === "index.js" || file === "main.js" || file.endsWith(".js"));
          if (mainFile) {
            pluginPaths.push(join5(fullPath, mainFile));
          }
        }
      }
      this.logger.info(`Discovered ${pluginPaths.length} potential plugins in ${directory}`);
      return pluginPaths;
    } catch (error) {
      this.logger.error(`Failed to discover plugins in ${directory}:`, error);
      return [];
    }
  }
  async loadBuiltinPlugins() {
    const builtinPluginPaths = [
      "./builtin/eslint-adapter.js",
      "./builtin/prettier-adapter.js",
      "./builtin/typescript-adapter.js",
      "./builtin/bun-test-adapter.js"
    ];
    return this.loadPlugins(builtinPluginPaths);
  }
  async registerDiscoveredPlugins(pluginManager, directory) {
    let plugins = [];
    try {
      const builtinPlugins = await this.loadBuiltinPlugins();
      plugins.push(...builtinPlugins);
    } catch (error) {
      this.logger.warn("Failed to load built-in plugins:", error);
    }
    if (directory) {
      try {
        const discoveredPaths = await this.discoverPlugins(directory);
        const discoveredPlugins = await this.loadPlugins(discoveredPaths);
        plugins.push(...discoveredPlugins);
      } catch (error) {
        this.logger.warn(`Failed to load plugins from ${directory}:`, error);
      }
    }
    if (plugins.length > 0) {
      await pluginManager.registerPlugins(plugins);
      this.logger.info(`Registered ${plugins.length} plugins with plugin manager`);
    } else {
      this.logger.warn("No plugins were loaded or registered");
    }
  }
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values());
  }
  isPluginLoaded(name) {
    return this.loadedPlugins.has(name);
  }
  getLoadedPlugin(name) {
    return this.loadedPlugins.get(name);
  }
  isValidPlugin(plugin) {
    if (typeof plugin !== "object" || plugin === null) {
      return false;
    }
    const p = plugin;
    return typeof p["name"] === "string" && typeof p["version"] === "string" && typeof p["initialize"] === "function" && typeof p["execute"] === "function" && typeof p["getDefaultConfig"] === "function" && typeof p["validateConfig"] === "function" && typeof p["supportsIncremental"] === "function" && typeof p["supportsCache"] === "function" && typeof p["getMetrics"] === "function";
  }
  isPluginFile(filename) {
    return filename.endsWith(".js") || filename.endsWith(".ts") || filename.endsWith(".mjs");
  }
  async cleanup() {
    for (const [name, plugin] of this.loadedPlugins) {
      try {
        if (plugin.cleanup) {
          await plugin.cleanup();
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup plugin ${name}:`, error);
      }
    }
    this.loadedPlugins.clear();
    this.logger.info("Plugin loader cleaned up");
  }
}

// ../../packages/core/src/analysis/memory-cache.ts
class LRUCache {
  cache = new Map;
  config;
  cleanupTimer = null;
  constructor(config) {
    this.config = config;
    this.startCleanup();
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }
  set(key, value, ttl) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    while (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    const entry = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };
    this.cache.set(key, entry);
  }
  delete(key) {
    return this.cache.delete(key);
  }
  has(key) {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }
  clear() {
    this.cache.clear();
  }
  size() {
    return this.cache.size;
  }
  getStats() {
    let hits = 0;
    let misses = 0;
    let totalAccesses = 0;
    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      hits += entry.accessCount - 1;
    }
    misses = this.cache.size;
    return {
      hits,
      misses,
      sets: this.cache.size,
      deletes: 0,
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? hits / totalAccesses : 0
    };
  }
  cleanup() {
    let cleanedCount = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    return cleanedCount;
  }
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
  isExpired(entry) {
    if (!entry.ttl)
      return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
}

// src/hooks/useDashboardStore.ts
var initialState, useDashboardStore;
var init_useDashboardStore = __esm(() => {
  init_esm();
  initialState = {
    results: {
      currentResult: null,
      filteredIssues: [],
      selectedIssue: null,
      filters: {
        severity: ["error", "warning", "info"],
        tools: [],
        filePaths: [],
        fixable: null,
        minScore: null,
        maxScore: null,
        searchQuery: ""
      },
      isAnalyzing: false,
      analysisProgress: null
    },
    ui: {
      currentView: "dashboard",
      currentPage: 1,
      itemsPerPage: 10,
      sortBy: "score",
      sortOrder: "desc",
      isFilterMenuOpen: false,
      isExportMenuOpen: false
    },
    navigation: {
      selectedIndex: 0,
      navigationHistory: []
    }
  };
  useDashboardStore = create((set, get) => ({
    currentView: initialState.ui.currentView,
    filteredIssues: initialState.results.filteredIssues,
    selectedIssue: initialState.results.selectedIssue,
    isAnalyzing: initialState.results.isAnalyzing,
    analysisProgress: initialState.results.analysisProgress,
    filters: initialState.results.filters,
    currentPage: initialState.ui.currentPage,
    itemsPerPage: initialState.ui.itemsPerPage,
    sortBy: initialState.ui.sortBy,
    sortOrder: initialState.ui.sortOrder,
    selectedIndex: initialState.navigation.selectedIndex,
    currentResult: initialState.results.currentResult,
    ...initialState,
    setAnalysisResult: (result) => set((state) => {
      if (!result) {
        return {
          results: {
            ...state.results,
            currentResult: null,
            filteredIssues: []
          },
          currentResult: null,
          filteredIssues: []
        };
      }
      const transformedIssues = result.toolResults.flatMap((toolResult) => toolResult.issues);
      return {
        results: {
          ...state.results,
          currentResult: result,
          filteredIssues: transformedIssues
        },
        currentResult: result,
        filteredIssues: transformedIssues
      };
    }),
    updateFilteredIssues: (issues) => set((state) => ({
      results: {
        ...state.results,
        filteredIssues: issues
      },
      filteredIssues: issues
    })),
    setSelectedIssue: (issue) => set((state) => ({
      results: {
        ...state.results,
        selectedIssue: issue
      },
      selectedIssue: issue
    })),
    updateFilters: (filters) => set((state) => ({
      results: {
        ...state.results,
        filters: {
          ...state.results.filters,
          ...filters
        }
      },
      filters: {
        ...state.filters,
        ...filters
      }
    })),
    setAnalysisProgress: (progress) => set((state) => ({
      results: {
        ...state.results,
        analysisProgress: progress
      },
      analysisProgress: progress
    })),
    setAnalyzing: (isAnalyzing) => set((state) => ({
      results: {
        ...state.results,
        isAnalyzing
      },
      isAnalyzing
    })),
    setCurrentView: (view) => set((state) => ({
      ui: {
        ...state.ui,
        currentView: view
      },
      currentView: view
    })),
    setCurrentPage: (page) => set((state) => ({
      ui: {
        ...state.ui,
        currentPage: page
      },
      currentPage: page
    })),
    setSortOrder: (field, order) => set((state) => ({
      ui: {
        ...state.ui,
        sortBy: field,
        sortOrder: order
      },
      sortBy: field,
      sortOrder: order
    })),
    setItemsPerPage: (count) => set((state) => ({
      ui: {
        ...state.ui,
        itemsPerPage: count
      },
      itemsPerPage: count
    })),
    toggleFilterMenu: () => set((state) => ({
      ui: {
        ...state.ui,
        isFilterMenuOpen: !state.ui.isFilterMenuOpen
      }
    })),
    toggleExportMenu: () => set((state) => ({
      ui: {
        ...state.ui,
        isExportMenuOpen: !state.ui.isExportMenuOpen
      }
    })),
    setSelectedIndex: (index) => set((state) => ({
      navigation: {
        ...state.navigation,
        selectedIndex: index
      },
      selectedIndex: index
    })),
    addToNavigationHistory: (view, selectedIndex) => set((state) => ({
      navigation: {
        ...state.navigation,
        navigationHistory: [
          ...state.navigation.navigationHistory,
          {
            view,
            selectedIndex,
            timestamp: new Date
          }
        ]
      }
    })),
    goBack: () => {
      const { navigationHistory } = get().navigation;
      if (navigationHistory.length > 0) {
        const previousState = navigationHistory[navigationHistory.length - 1];
        if (previousState) {
          set((state) => ({
            ui: {
              ...state.ui,
              currentView: previousState.view
            },
            navigation: {
              selectedIndex: previousState.selectedIndex,
              navigationHistory: navigationHistory.slice(0, -1)
            },
            currentView: previousState.view,
            selectedIndex: previousState.selectedIndex
          }));
        }
      }
    },
    resetDashboard: () => set(initialState),
    clearFilters: () => set((state) => ({
      results: {
        ...state.results,
        filters: initialState.results.filters
      }
    }))
  }));
});

// src/utils/color-coding.ts
function getSeverityColor(severity) {
  switch (severity) {
    case "error":
      return "red";
    case "warning":
      return "yellow";
    case "info":
      return "blue";
    default:
      return "gray";
  }
}
function getSeveritySymbol(severity) {
  switch (severity) {
    case "error":
      return "✗";
    case "warning":
      return "⚠";
    case "info":
      return "ℹ";
    default:
      return "•";
  }
}
function getScoreColor(score) {
  if (score >= 90)
    return "green";
  if (score >= 80)
    return "blue";
  if (score >= 70)
    return "yellow";
  if (score >= 60)
    return "magenta";
  return "red";
}
function getCoverageColor(coverage) {
  if (coverage >= 80)
    return "green";
  if (coverage >= 60)
    return "yellow";
  if (coverage >= 40)
    return "magenta";
  return "red";
}
var init_color_coding = () => {};

// src/components/dashboard/metrics-summary.tsx
import { Box, Text } from "ink";
import { jsxDEV } from "react/jsx-dev-runtime";
function MetricsSummary() {
  const { currentResult, filteredIssues } = useDashboardStore();
  if (!currentResult) {
    return /* @__PURE__ */ jsxDEV(Box, {
      marginBottom: 1,
      children: /* @__PURE__ */ jsxDEV(Text, {
        color: "gray",
        children: "No analysis results available"
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  const { summary: _summary, toolResults, duration, overallScore } = currentResult;
  const errorCount = filteredIssues.filter((issue) => issue.type === "error").length;
  const warningCount = filteredIssues.filter((issue) => issue.type === "warning").length;
  const infoCount = filteredIssues.filter((issue) => issue.type === "info").length;
  const fixableCount = filteredIssues.filter((issue) => issue.fixable).length;
  const coverage = toolResults.find((result) => result.coverage)?.coverage;
  return /* @__PURE__ */ jsxDEV(Box, {
    marginBottom: 1,
    flexDirection: "column",
    children: [
      /* @__PURE__ */ jsxDEV(Box, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV(Text, {
          bold: true,
          color: "cyan",
          children: "Analysis Summary"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Box, {
        justifyContent: "space-between",
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV(Box, {
            marginRight: 2,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                children: "Score: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                bold: true,
                color: getScoreColor(overallScore),
                children: [
                  overallScore,
                  "/100"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Box, {
            marginRight: 2,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                children: "Issues: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "red",
                children: errorCount
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                children: " / "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "yellow",
                children: warningCount
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                children: " / "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "blue",
                children: infoCount
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                dimColor: true,
                children: " (E/W/I)"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Box, {
            marginRight: 2,
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                children: "Fixable: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "green",
                children: fixableCount
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV(Box, {
            children: [
              /* @__PURE__ */ jsxDEV(Text, {
                children: "Time: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV(Text, {
                color: "magenta",
                children: [
                  (duration / 1000).toFixed(1),
                  "s"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      coverage && /* @__PURE__ */ jsxDEV(Box, {
        justifyContent: "space-between",
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV(Box, {
          marginRight: 2,
          children: [
            /* @__PURE__ */ jsxDEV(Text, {
              children: "Coverage: "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              color: getCoverageColor(coverage.lines.percentage),
              children: [
                "L:",
                coverage.lines.percentage.toFixed(1),
                "%"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              children: " / "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              color: getCoverageColor(coverage.functions.percentage),
              children: [
                "F:",
                coverage.functions.percentage.toFixed(1),
                "%"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              children: " / "
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV(Text, {
              color: getCoverageColor(coverage.branches.percentage),
              children: [
                "B:",
                coverage.branches.percentage.toFixed(1),
                "%"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Box, {
        justifyContent: "space-between",
        children: /* @__PURE__ */ jsxDEV(Text, {
          color: "gray",
          dimColor: true,
          children: [
            "Tools analyzed: ",
            toolResults.length,
            " | Total issues: ",
            filteredIssues.length
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_metrics_summary = __esm(() => {
  init_useDashboardStore();
  init_color_coding();
});

// src/utils/keyboard-navigation.ts
function createListNavigation(itemCount, onSelect, config = { wrapAround: true, skipDisabled: true, pageSize: 10 }) {
  return {
    handleKeyDown: (key, currentIndex) => {
      let newIndex = currentIndex;
      switch (key) {
        case "up":
        case "k":
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case "down":
        case "j":
          newIndex = Math.min(itemCount - 1, currentIndex + 1);
          break;
        case "home":
          newIndex = 0;
          break;
        case "end":
          newIndex = itemCount - 1;
          break;
        case "pageup":
          newIndex = Math.max(0, currentIndex - config.pageSize);
          break;
        case "pagedown":
          newIndex = Math.min(itemCount - 1, currentIndex + config.pageSize);
          break;
        case "enter":
          onSelect(currentIndex);
          break;
        default:
          return currentIndex;
      }
      if (config.wrapAround) {
        if (newIndex < 0)
          newIndex = itemCount - 1;
        if (newIndex >= itemCount)
          newIndex = 0;
      }
      return newIndex;
    }
  };
}
function createMenuNavigation(itemCount, onSelect, onCancel) {
  return {
    handleKeyDown: (key, currentIndex) => {
      let newIndex = currentIndex;
      switch (key) {
        case "up":
        case "k":
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case "down":
        case "j":
          newIndex = Math.min(itemCount - 1, currentIndex + 1);
          break;
        case "home":
          newIndex = 0;
          break;
        case "end":
          newIndex = itemCount - 1;
          break;
        case "enter":
        case " ":
          return { index: currentIndex, action: "select" };
        case "escape":
          onCancel();
          return { index: currentIndex, action: "cancel" };
        default:
          if (key >= "1" && key <= "9") {
            const numericIndex = parseInt(key) - 1;
            if (numericIndex < itemCount) {
              return { index: numericIndex, action: "select" };
            }
          }
          return { index: currentIndex };
      }
      return { index: newIndex };
    }
  };
}
var init_keyboard_navigation = () => {};

// src/components/issues/issue-item.tsx
import { Box as Box2, Text as Text2 } from "ink";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function IssueItem({
  issue,
  isSelected,
  index: _index
}) {
  const {
    id: _id,
    type,
    toolName,
    filePath,
    lineNumber,
    message,
    ruleId,
    fixable,
    suggestion,
    score
  } = issue;
  const maxMessageLength = 80;
  const truncatedMessage = message.length > maxMessageLength ? `${message.substring(0, maxMessageLength - 3)}...` : message;
  const maxPathLength = 30;
  const displayPath = filePath.length > maxPathLength ? `.../${filePath.substring(filePath.length - maxPathLength + 4)}` : filePath;
  return /* @__PURE__ */ jsxDEV2(Box2, {
    flexDirection: "column",
    paddingX: 1,
    borderStyle: isSelected ? "single" : undefined,
    borderColor: isSelected ? "cyan" : undefined,
    children: [
      /* @__PURE__ */ jsxDEV2(Box2, {
        justifyContent: "space-between",
        marginBottom: 0,
        children: [
          /* @__PURE__ */ jsxDEV2(Box2, {
            marginRight: 1,
            children: [
              /* @__PURE__ */ jsxDEV2(Text2, {
                color: getSeverityColor(type),
                children: getSeveritySymbol(type)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2(Text2, {
                color: "gray",
                dimColor: true,
                children: [
                  String(_index + 1).padStart(2, " "),
                  "."
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2(Box2, {
            flexGrow: 1,
            marginRight: 1,
            children: /* @__PURE__ */ jsxDEV2(Text2, {
              color: isSelected ? "white" : "reset",
              children: truncatedMessage
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2(Box2, {
            children: [
              /* @__PURE__ */ jsxDEV2(Text2, {
                color: isSelected ? "white" : "yellow",
                children: score
              }, undefined, false, undefined, this),
              fixable && /* @__PURE__ */ jsxDEV2(Box2, {
                marginLeft: 1,
                children: /* @__PURE__ */ jsxDEV2(Text2, {
                  color: "green",
                  children: "✓"
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2(Box2, {
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsxDEV2(Box2, {
            children: [
              /* @__PURE__ */ jsxDEV2(Text2, {
                color: "gray",
                dimColor: true,
                children: [
                  displayPath,
                  ":",
                  lineNumber
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV2(Box2, {
                marginLeft: 1,
                children: /* @__PURE__ */ jsxDEV2(Text2, {
                  color: "gray",
                  dimColor: true,
                  children: [
                    "(",
                    toolName,
                    ")"
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this),
              ruleId && /* @__PURE__ */ jsxDEV2(Box2, {
                marginLeft: 1,
                children: /* @__PURE__ */ jsxDEV2(Text2, {
                  color: "cyan",
                  dimColor: true,
                  children: [
                    "[",
                    ruleId,
                    "]"
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2(Box2, {
            children: /* @__PURE__ */ jsxDEV2(Text2, {
              color: getSeverityColor(type),
              backgroundColor: isSelected ? "black" : undefined,
              children: type.toUpperCase()
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      isSelected && suggestion && /* @__PURE__ */ jsxDEV2(Box2, {
        marginTop: 1,
        paddingX: 1,
        children: /* @__PURE__ */ jsxDEV2(Text2, {
          color: "cyan",
          dimColor: true,
          children: [
            "\uD83D\uDCA1 ",
            suggestion
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_issue_item = __esm(() => {
  init_color_coding();
});

// src/components/dashboard/sort-controls.tsx
import { Box as Box3, Text as Text3 } from "ink";
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function SortControls({
  onSortChange: _onSortChange
}) {
  const {
    ui: { sortBy, sortOrder },
    setSortOrder
  } = useDashboardStore();
  const handleSortChange = (field, order) => {
    setSortOrder(field, order);
    _onSortChange?.(field, order);
  };
  const _toggleSortOrder = (field) => {
    const newOrder = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    handleSortChange(field, newOrder);
  };
  const sortFields = [
    { field: "score", label: "Score", width: 8 },
    { field: "severity", label: "Sev", width: 6 },
    { field: "filePath", label: "File", width: 30 },
    { field: "toolName", label: "Tool", width: 12 },
    { field: "lineNumber", label: "Line", width: 6 }
  ];
  return /* @__PURE__ */ jsxDEV3(Box3, {
    marginBottom: 1,
    borderStyle: "single",
    borderColor: "gray",
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV3(Box3, {
        justifyContent: "space-between",
        children: sortFields.map(({ field, label, width: _width }) => {
          const isActive = sortBy === field;
          const orderSymbol = isActive ? sortOrder === "asc" ? "↑" : "↓" : " ";
          return /* @__PURE__ */ jsxDEV3(Box3, {
            marginRight: 1,
            children: [
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: isActive ? "cyan" : "gray",
                underline: isActive,
                bold: isActive,
                children: label
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3(Box3, {
                marginLeft: 1,
                children: /* @__PURE__ */ jsxDEV3(Text3, {
                  color: isActive ? "yellow" : "gray",
                  children: orderSymbol
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, field, true, undefined, this);
        })
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3(Box3, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV3(Text3, {
          color: "gray",
          dimColor: true,
          children: "Click headers or use Tab to sort"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_sort_controls = __esm(() => {
  init_useDashboardStore();
});

// src/components/dashboard/pagination.tsx
import React2 from "react";
import { Box as Box4, Text as Text4 } from "ink";
import { jsxDEV as jsxDEV4, Fragment } from "react/jsx-dev-runtime";
function Pagination() {
  const {
    filteredIssues,
    ui: { currentPage, itemsPerPage },
    setCurrentPage
  } = useDashboardStore();
  const totalItems = filteredIssues.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  if (totalPages <= 1) {
    return null;
  }
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const _goToFirstPage = () => goToPage(1);
  const _goToLastPage = () => goToPage(totalPages);
  const _goToPreviousPage = () => goToPage(currentPage - 1);
  const _goToNextPage = () => goToPage(currentPage + 1);
  const getVisiblePages = () => {
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    let startPage = Math.max(1, currentPage - halfVisible);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    const pages = [];
    for (let i = startPage;i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };
  const visiblePages = getVisiblePages();
  return /* @__PURE__ */ jsxDEV4(Box4, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsxDEV4(Box4, {
        justifyContent: "space-between",
        alignItems: "center",
        children: [
          /* @__PURE__ */ jsxDEV4(Box4, {
            marginRight: 2,
            children: /* @__PURE__ */ jsxDEV4(Text4, {
              color: currentPage > 1 ? "cyan" : "gray",
              dimColor: currentPage === 1,
              children: currentPage > 1 ? "← Previous" : "← Previous"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Box4, {
            flexGrow: 1,
            justifyContent: "center",
            children: visiblePages.map((page, _index) => {
              const isCurrentPage = page === currentPage;
              const showStartEllipsis = _index === 0 && page > 2;
              const showEndEllipsis = _index === visiblePages.length - 1 && page < totalPages - 1;
              return /* @__PURE__ */ jsxDEV4(React2.Fragment, {
                children: [
                  showStartEllipsis && /* @__PURE__ */ jsxDEV4(Fragment, {
                    children: [
                      /* @__PURE__ */ jsxDEV4(Box4, {
                        marginRight: 1,
                        children: /* @__PURE__ */ jsxDEV4(Text4, {
                          color: "gray",
                          children: "1"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV4(Box4, {
                        marginRight: 1,
                        children: /* @__PURE__ */ jsxDEV4(Text4, {
                          color: "gray",
                          children: "..."
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV4(Box4, {
                    marginRight: 1,
                    children: /* @__PURE__ */ jsxDEV4(Text4, {
                      color: isCurrentPage ? "white" : "cyan",
                      backgroundColor: isCurrentPage ? "blue" : undefined,
                      underline: isCurrentPage,
                      children: page
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this),
                  showEndEllipsis && /* @__PURE__ */ jsxDEV4(Fragment, {
                    children: [
                      /* @__PURE__ */ jsxDEV4(Box4, {
                        marginRight: 1,
                        children: /* @__PURE__ */ jsxDEV4(Text4, {
                          color: "gray",
                          children: "..."
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV4(Box4, {
                        marginRight: 1,
                        children: /* @__PURE__ */ jsxDEV4(Text4, {
                          color: "gray",
                          children: totalPages
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, page, true, undefined, this);
            })
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Box4, {
            marginLeft: 2,
            children: /* @__PURE__ */ jsxDEV4(Text4, {
              color: currentPage < totalPages ? "cyan" : "gray",
              dimColor: currentPage === totalPages,
              children: currentPage < totalPages ? "Next →" : "Next →"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV4(Box4, {
        justifyContent: "center",
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV4(Text4, {
          color: "gray",
          dimColor: true,
          children: [
            "Showing ",
            startIndex,
            "-",
            endIndex,
            " of ",
            totalItems,
            " issues"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_pagination = __esm(() => {
  init_useDashboardStore();
});

// src/components/dashboard/issue-list.tsx
import { useState, useEffect } from "react";
import { Box as Box5, Text as Text5, useInput } from "ink";
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
function IssueList() {
  const {
    filteredIssues,
    selectedIssue: _selectedIssue,
    currentView,
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    setSelectedIssue,
    setCurrentView,
    setSelectedIndex,
    addToNavigationHistory
  } = useDashboardStore();
  const [selectedIndex, setSelectedIndexState] = useState(0);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredIssues.length);
  const currentIssues = filteredIssues.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const sortedIssues = [...currentIssues].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "score":
        comparison = a.score - b.score;
        break;
      case "severity": {
        const severityOrder = { error: 3, warning: 2, info: 1 };
        comparison = severityOrder[a.type] - severityOrder[b.type];
        break;
      }
      case "filePath":
        comparison = a.filePath.localeCompare(b.filePath);
        break;
      case "toolName":
        comparison = a.toolName.localeCompare(b.toolName);
        break;
      case "lineNumber":
        comparison = a.lineNumber - b.lineNumber;
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });
  const navigationHandler = createListNavigation(sortedIssues.length, (index) => {
    const issue = sortedIssues[index];
    if (issue) {
      setSelectedIssue(issue);
      setCurrentView("issue-details");
      addToNavigationHistory("issue-details", index);
    }
  }, { wrapAround: true, skipDisabled: true, pageSize: 5 });
  useInput((_input, key) => {
    if (currentView === "dashboard" || currentView === "issue-list") {
      let newIndex = selectedIndex;
      if (key.upArrow || _input === "k") {
        newIndex = navigationHandler.handleKeyDown("up", selectedIndex);
      } else if (key.downArrow || _input === "j") {
        newIndex = navigationHandler.handleKeyDown("down", selectedIndex);
      } else if (key.ctrl && _input === "a") {
        newIndex = navigationHandler.handleKeyDown("home", selectedIndex);
      } else if (key.ctrl && _input === "e") {
        newIndex = navigationHandler.handleKeyDown("end", selectedIndex);
      } else if (key.pageUp) {
        newIndex = navigationHandler.handleKeyDown("pageup", selectedIndex);
      } else if (key.pageDown) {
        newIndex = navigationHandler.handleKeyDown("pagedown", selectedIndex);
      } else if (key.return) {
        navigationHandler.handleKeyDown("enter", selectedIndex);
        return;
      } else if (_input >= "1" && _input <= "9") {
        const numericIndex = parseInt(_input) - 1;
        if (numericIndex < sortedIssues.length) {
          newIndex = numericIndex;
          navigationHandler.handleKeyDown("enter", numericIndex);
        }
      }
      if (newIndex !== selectedIndex) {
        setSelectedIndexState(newIndex);
        setSelectedIndex(newIndex);
        if (sortedIssues[newIndex]) {
          setSelectedIssue(sortedIssues[newIndex] ?? null);
        }
      }
    }
  });
  useEffect(() => {
    if (sortedIssues[selectedIndex]) {
      setSelectedIssue(sortedIssues[selectedIndex]);
    }
  }, [selectedIndex, sortedIssues, setSelectedIssue]);
  const renderHeader = () => /* @__PURE__ */ jsxDEV5(Box5, {
    marginBottom: 1,
    children: /* @__PURE__ */ jsxDEV5(Box5, {
      justifyContent: "space-between",
      width: "100%",
      children: [
        /* @__PURE__ */ jsxDEV5(Text5, {
          bold: true,
          color: "cyan",
          children: [
            "Issues (",
            startIndex + 1,
            "-",
            endIndex,
            " of ",
            filteredIssues.length,
            ")"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV5(Text5, {
          color: "gray",
          dimColor: true,
          children: [
            "Page ",
            currentPage,
            " of ",
            totalPages
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
  if (sortedIssues.length === 0) {
    return /* @__PURE__ */ jsxDEV5(Box5, {
      flexDirection: "column",
      children: [
        renderHeader(),
        /* @__PURE__ */ jsxDEV5(Box5, {
          justifyContent: "center",
          padding: 2,
          children: /* @__PURE__ */ jsxDEV5(Text5, {
            color: "gray",
            children: "No issues found"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV5(Box5, {
    flexDirection: "column",
    children: [
      renderHeader(),
      /* @__PURE__ */ jsxDEV5(Box5, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV5(SortControls, {}, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Box5, {
        flexDirection: "column",
        marginBottom: 1,
        children: sortedIssues.length > 0 ? sortedIssues.map((issue, index) => /* @__PURE__ */ jsxDEV5(IssueItem, {
          issue,
          isSelected: index === selectedIndex,
          index
        }, issue.id, false, undefined, this)) : /* @__PURE__ */ jsxDEV5(Box5, {
          justifyContent: "center",
          padding: 2,
          children: /* @__PURE__ */ jsxDEV5(Text5, {
            color: "gray",
            children: "No issues found"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Pagination, {}, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Box5, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV5(Text5, {
          color: "gray",
          dimColor: true,
          children: "↑↓ Navigate | Enter: Details | 1-9: Quick jump | Home/End: First/Last | Page Up/Down: Navigate pages"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_issue_list = __esm(() => {
  init_useDashboardStore();
  init_keyboard_navigation();
  init_issue_item();
  init_sort_controls();
  init_pagination();
});

// src/components/dashboard/issue-details.tsx
import { Box as Box6, Text as Text6, useInput as useInput2 } from "ink";
import { jsxDEV as jsxDEV6, Fragment as Fragment2 } from "react/jsx-dev-runtime";
function IssueDetails() {
  const { selectedIssue, setCurrentView } = useDashboardStore();
  useInput2((input, key) => {
    if (key.escape) {
      setCurrentView("dashboard");
    }
  });
  if (!selectedIssue) {
    return /* @__PURE__ */ jsxDEV6(Box6, {
      flexDirection: "column",
      padding: 2,
      children: [
        /* @__PURE__ */ jsxDEV6(Box6, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV6(Text6, {
            color: "gray",
            children: "No issue selected"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV6(Box6, {
          children: /* @__PURE__ */ jsxDEV6(Text6, {
            color: "gray",
            dimColor: true,
            children: "Press Escape to go back"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const { id, type, toolName, filePath, lineNumber, message, ruleId, fixable, suggestion, score } = selectedIssue;
  const _fileLocation = `${filePath}:${lineNumber}`;
  const fileName = filePath.split("/").pop() ?? filePath;
  return /* @__PURE__ */ jsxDEV6(Box6, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsxDEV6(Box6, {
        marginBottom: 1,
        borderStyle: "single",
        borderColor: getSeverityColor(type),
        paddingX: 1,
        children: /* @__PURE__ */ jsxDEV6(Box6, {
          justifyContent: "space-between",
          children: [
            /* @__PURE__ */ jsxDEV6(Box6, {
              children: [
                /* @__PURE__ */ jsxDEV6(Text6, {
                  color: getSeverityColor(type),
                  children: getSeveritySymbol(type)
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV6(Text6, {
                  bold: true,
                  color: getSeverityColor(type),
                  children: [
                    " ",
                    type.toUpperCase()
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsxDEV6(Text6, {
                  bold: true,
                  color: "white",
                  children: [
                    " ",
                    "Issue Details"
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV6(Box6, {
              children: /* @__PURE__ */ jsxDEV6(Text6, {
                color: getScoreColor(score),
                children: [
                  "Score: ",
                  score
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(Box6, {
        flexDirection: "column",
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV6(Box6, {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV6(Text6, {
                bold: true,
                color: "white",
                children: "Message:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: /* @__PURE__ */ jsxDEV6(Text6, {
                  children: message
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV6(Box6, {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV6(Text6, {
                bold: true,
                color: "white",
                children: "Location:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: [
                  /* @__PURE__ */ jsxDEV6(Text6, {
                    color: "cyan",
                    children: fileName
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV6(Text6, {
                    color: "gray",
                    dimColor: true,
                    children: [
                      ":",
                      lineNumber
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: /* @__PURE__ */ jsxDEV6(Text6, {
                  color: "gray",
                  dimColor: true,
                  children: filePath
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV6(Box6, {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV6(Text6, {
                bold: true,
                color: "white",
                children: "Tool:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: [
                  /* @__PURE__ */ jsxDEV6(Text6, {
                    color: "yellow",
                    children: toolName
                  }, undefined, false, undefined, this),
                  ruleId && /* @__PURE__ */ jsxDEV6(Fragment2, {
                    children: [
                      /* @__PURE__ */ jsxDEV6(Text6, {
                        color: "gray",
                        dimColor: true,
                        children: [
                          " ",
                          "- Rule:",
                          " "
                        ]
                      }, undefined, true, undefined, this),
                      /* @__PURE__ */ jsxDEV6(Text6, {
                        color: "cyan",
                        children: ruleId
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV6(Box6, {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV6(Text6, {
                bold: true,
                color: "white",
                children: "ID:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: /* @__PURE__ */ jsxDEV6(Text6, {
                  color: "gray",
                  dimColor: true,
                  children: id
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV6(Box6, {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV6(Text6, {
                bold: true,
                color: "white",
                children: "Fixable:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: fixable ? /* @__PURE__ */ jsxDEV6(Text6, {
                  color: "green",
                  children: "✓ Yes"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV6(Text6, {
                  color: "red",
                  children: "✗ No"
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          suggestion && /* @__PURE__ */ jsxDEV6(Box6, {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV6(Text6, {
                bold: true,
                color: "white",
                children: "Suggestion:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6(Box6, {
                marginLeft: 2,
                children: /* @__PURE__ */ jsxDEV6(Text6, {
                  color: "cyan",
                  children: [
                    "\uD83D\uDCA1 ",
                    suggestion
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV6(Box6, {
        borderStyle: "single",
        borderColor: "gray",
        paddingX: 1,
        children: /* @__PURE__ */ jsxDEV6(Text6, {
          color: "gray",
          dimColor: true,
          children: "Press Escape to go back to the issue list"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_issue_details = __esm(() => {
  init_useDashboardStore();
  init_color_coding();
});

// src/components/dashboard/filters.tsx
import { Box as Box7, Text as Text7 } from "ink";
import { jsxDEV as jsxDEV7 } from "react/jsx-dev-runtime";
function FilterBar() {
  const { filters, filteredIssues } = useDashboardStore();
  const { severity, tools, fixable, searchQuery } = filters;
  const activeFilterCount = [
    severity.length < 3 ? 1 : 0,
    tools.length > 0 ? 1 : 0,
    fixable !== null ? 1 : 0,
    searchQuery.trim() !== "" ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);
  const getSeverityDisplay = () => {
    if (severity.length === 3)
      return "All";
    return severity.map((s) => {
      const symbol = getSeveritySymbol(s);
      return `${symbol}${s.charAt(0).toUpperCase()}`;
    }).join(" ");
  };
  const getOtherFiltersDisplay = () => {
    const parts = [];
    if (tools.length > 0) {
      parts.push(`Tools: ${tools.length}`);
    }
    if (fixable !== null) {
      parts.push(`Fixable: ${fixable ? "Yes" : "No"}`);
    }
    if (searchQuery.trim() !== "") {
      parts.push(`Search: "${searchQuery}"`);
    }
    return parts.join(" | ");
  };
  return /* @__PURE__ */ jsxDEV7(Box7, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsxDEV7(Box7, {
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsxDEV7(Box7, {
            children: [
              /* @__PURE__ */ jsxDEV7(Text7, {
                color: "gray",
                dimColor: true,
                children: "Filters:"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV7(Text7, {
                color: "cyan",
                children: [
                  " ",
                  getSeverityDisplay()
                ]
              }, undefined, true, undefined, this),
              activeFilterCount > 0 && /* @__PURE__ */ jsxDEV7(Text7, {
                color: "yellow",
                children: [
                  " (",
                  activeFilterCount,
                  " active)"
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV7(Box7, {
            children: /* @__PURE__ */ jsxDEV7(Text7, {
              color: "gray",
              dimColor: true,
              children: "Press 'f' to modify filters"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      (tools.length > 0 || fixable !== null || searchQuery.trim() !== "") && /* @__PURE__ */ jsxDEV7(Box7, {
        children: /* @__PURE__ */ jsxDEV7(Text7, {
          color: "gray",
          dimColor: true,
          children: [
            " ",
            getOtherFiltersDisplay()
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV7(Box7, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV7(Text7, {
          color: "gray",
          dimColor: true,
          children: [
            "Showing ",
            filteredIssues.length,
            " issues"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_filters = __esm(() => {
  init_useDashboardStore();
  init_color_coding();
});

// src/utils/type-transformers.ts
function transformCoreIssueToCLI(coreIssue) {
  const validTypes = ["error", "warning", "info"];
  const type = coreIssue.type.toLowerCase();
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid issue type: ${coreIssue.type}. Must be one of: ${validTypes.join(", ")}`);
  }
  return {
    ...coreIssue,
    type
  };
}
function transformCoreIssuesToCLI(coreIssues) {
  return coreIssues.map(transformCoreIssueToCLI);
}
function transformCoreAnalysisResultToCLI(coreResult) {
  const coreResultAny = coreResult;
  return {
    id: coreResultAny.id ?? `analysis-${Date.now()}`,
    projectId: coreResultAny.projectId ?? "unknown-project",
    timestamp: typeof coreResult.timestamp === "string" ? coreResult.timestamp : new Date().toISOString(),
    duration: coreResultAny.duration ?? 0,
    overallScore: coreResultAny.overallScore ?? 0,
    toolResults: (coreResultAny.toolResults ?? []).map((toolResult) => ({
      ...toolResult,
      issues: transformCoreIssuesToCLI(toolResult.issues)
    })),
    summary: coreResultAny.summary ?? {
      totalIssues: 0,
      totalErrors: 0,
      totalWarnings: 0,
      totalFixable: 0,
      overallScore: 0,
      toolCount: 0,
      executionTime: 0
    },
    aiPrompts: coreResultAny.aiPrompts ?? []
  };
}

// src/services/dashboard/dashboard-service.ts
class DashboardService {
  processResults(analysisResult) {
    const issues = this.extractAllIssues(analysisResult);
    const metrics = this.calculateMetrics(analysisResult, issues);
    const summary = this.generateSummary(analysisResult, issues);
    return {
      analysisResult,
      filteredIssues: issues,
      metrics,
      summary
    };
  }
  applyFilters(issues, filters) {
    return issues.filter((issue) => {
      if (!filters.severity.includes(issue.type)) {
        return false;
      }
      if (filters.tools.length > 0 && !filters.tools.includes(issue.toolName)) {
        return false;
      }
      if (filters.filePaths.length > 0) {
        const matchesPath = filters.filePaths.some((path) => issue.filePath.includes(path));
        if (!matchesPath)
          return false;
      }
      if (filters.fixable !== null && issue.fixable !== filters.fixable) {
        return false;
      }
      if (filters.minScore !== null && issue.score < filters.minScore) {
        return false;
      }
      if (filters.maxScore !== null && issue.score > filters.maxScore) {
        return false;
      }
      if (filters.searchQuery.trim() !== "") {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch = (issue.message.toLowerCase().includes(searchLower) || issue.filePath.toLowerCase().includes(searchLower) || issue.toolName.toLowerCase().includes(searchLower) || issue.ruleId?.toLowerCase().includes(searchLower)) ?? issue.suggestion?.toLowerCase().includes(searchLower);
        if (!matchesSearch)
          return false;
      }
      return true;
    });
  }
  sortIssues(issues, sortBy, order) {
    return [...issues].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "score":
          comparison = a.score - b.score;
          break;
        case "severity": {
          const severityOrder = { error: 3, warning: 2, info: 1 };
          comparison = severityOrder[a.type] - severityOrder[b.type];
          break;
        }
        case "filePath":
          comparison = a.filePath.localeCompare(b.filePath);
          break;
        case "toolName":
          comparison = a.toolName.localeCompare(b.toolName);
          break;
        case "lineNumber":
          comparison = a.lineNumber - b.lineNumber;
          break;
        default:
          comparison = 0;
      }
      return order === "asc" ? comparison : -comparison;
    });
  }
  extractAllIssues(analysisResult) {
    return analysisResult.toolResults.flatMap((toolResult) => toolResult.issues.map((issue) => transformCoreIssueToCLI(issue)));
  }
  calculateMetrics(analysisResult, issues) {
    const errorCount = issues.filter((issue) => issue.type === "error").length;
    const warningCount = issues.filter((issue) => issue.type === "warning").length;
    const infoCount = issues.filter((issue) => issue.type === "info").length;
    const fixableCount = issues.filter((issue) => issue.fixable).length;
    const coverage = analysisResult.toolResults.find((result) => result.coverage)?.coverage ?? null;
    return {
      totalIssues: issues.length,
      errorCount,
      warningCount,
      infoCount,
      fixableCount,
      overallScore: analysisResult.overallScore,
      coverage,
      toolsAnalyzed: analysisResult.toolResults.length,
      duration: analysisResult.duration
    };
  }
  generateSummary(analysisResult, issues) {
    const topIssues = [...issues].sort((a, b) => b.score - a.score).slice(0, 5);
    const fileIssueCount = new Map;
    issues.forEach((issue) => {
      const current = fileIssueCount.get(issue.filePath) ?? { count: 0, severity: issue.type };
      current.count++;
      if (issue.type === "error" || current.severity !== "error" && issue.type === "warning") {
        current.severity = issue.type;
      }
      fileIssueCount.set(issue.filePath, current);
    });
    const mostAffectedFiles = Array.from(fileIssueCount.entries()).map(([filePath, data]) => ({
      filePath,
      issueCount: data.count,
      severity: data.severity
    })).sort((a, b) => b.issueCount - a.issueCount).slice(0, 5);
    const toolSummary = analysisResult.toolResults.map((toolResult) => ({
      toolName: toolResult.toolName,
      issueCount: toolResult.issues.length,
      score: toolResult.metrics.score
    }));
    return {
      topIssues,
      mostAffectedFiles,
      toolSummary
    };
  }
  getFilterStatistics(originalIssues, filteredIssues, filters) {
    return {
      totalIssues: originalIssues.length,
      filteredIssues: filteredIssues.length,
      activeFilters: Object.entries(filters).filter(([key, value]) => {
        if (key === "severity")
          return value.length < 3;
        if (key === "tools" || key === "filePaths")
          return value.length > 0;
        if (key === "fixable")
          return value !== null;
        if (key === "minScore" || key === "maxScore")
          return value !== null;
        if (key === "searchQuery")
          return value.trim() !== "";
        return false;
      }).length,
      filterBreakdown: this.getFilterBreakdown(originalIssues, filters)
    };
  }
  getFilterBreakdown(issues, _filters) {
    const breakdown = {};
    const severityCounts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] ?? 0) + 1;
      return acc;
    }, {});
    Object.assign(breakdown, severityCounts);
    const toolCounts = issues.reduce((acc, issue) => {
      acc[issue.toolName] = (acc[issue.toolName] ?? 0) + 1;
      return acc;
    }, {});
    Object.keys(toolCounts).forEach((tool) => {
      const count = toolCounts[tool];
      if (count !== undefined) {
        breakdown[`tool:${tool}`] = count;
      }
    });
    return breakdown;
  }
}
var init_dashboard_service = () => {};

// src/hooks/useFilters.ts
import { useCallback, useMemo } from "react";
function useFilters(_originalIssues = []) {
  const {
    filteredIssues,
    filters,
    updateFilters,
    clearFilters,
    ui: { sortBy, sortOrder }
  } = useDashboardStore();
  const dashboardService = useMemo(() => new DashboardService, []);
  const processedIssues = useMemo(() => {
    if (_originalIssues.length === 0) {
      return dashboardService.sortIssues(filteredIssues, sortBy, sortOrder);
    }
    const filtered = dashboardService.applyFilters(_originalIssues, filters);
    return dashboardService.sortIssues(filtered, sortBy, sortOrder);
  }, [_originalIssues, filteredIssues, filters, sortBy, sortOrder, dashboardService]);
  const setSeverityFilter = useCallback((severity) => {
    updateFilters({ severity });
  }, [updateFilters]);
  const setToolFilter = useCallback((tools) => {
    updateFilters({ tools });
  }, [updateFilters]);
  const setFilePathFilter = useCallback((filePaths) => {
    updateFilters({ filePaths });
  }, [updateFilters]);
  const setFixableFilter = useCallback((fixable) => {
    updateFilters({ fixable });
  }, [updateFilters]);
  const setScoreRange = useCallback((minScore, maxScore) => {
    updateFilters({ minScore, maxScore });
  }, [updateFilters]);
  const setSearchQuery = useCallback((searchQuery) => {
    updateFilters({ searchQuery });
  }, [updateFilters]);
  const toggleSeverity = useCallback((severity) => {
    const currentSeverities = filters.severity;
    const newSeverities = currentSeverities.includes(severity) ? currentSeverities.filter((s) => s !== severity) : [...currentSeverities, severity];
    if (newSeverities.length > 0) {
      setSeverityFilter(newSeverities);
    }
  }, [filters.severity, setSeverityFilter]);
  const toggleTool = useCallback((tool) => {
    const currentTools = filters.tools;
    const newTools = currentTools.includes(tool) ? currentTools.filter((t) => t !== tool) : [...currentTools, tool];
    setToolFilter(newTools);
  }, [filters.tools, setToolFilter]);
  const addFilePath = useCallback((filePath) => {
    const currentPaths = filters.filePaths;
    if (!currentPaths.includes(filePath)) {
      setFilePathFilter([...currentPaths, filePath]);
    }
  }, [filters.filePaths, setFilePathFilter]);
  const removeFilePath = useCallback((filePath) => {
    const currentPaths = filters.filePaths;
    const newPaths = currentPaths.filter((path) => path !== filePath);
    setFilePathFilter(newPaths);
  }, [filters.filePaths, setFilePathFilter]);
  const toggleFixable = useCallback(() => {
    const currentFixable = filters.fixable;
    const newFixable = currentFixable === null ? true : currentFixable === true ? false : null;
    setFixableFilter(newFixable);
  }, [filters.fixable, setFixableFilter]);
  const clearAllFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);
  const getAvailableSeverities = useCallback(() => {
    return ["error", "warning", "info"];
  }, []);
  const getAvailableTools = useCallback(() => {
    const tools = new Set;
    const issuesToCheck = _originalIssues.length > 0 ? _originalIssues : filteredIssues;
    issuesToCheck.forEach((issue) => {
      tools.add(issue.toolName);
    });
    return Array.from(tools).sort();
  }, [_originalIssues, filteredIssues]);
  const getAvailableFilePaths = useCallback(() => {
    const paths = new Set;
    const issuesToCheck = _originalIssues.length > 0 ? _originalIssues : filteredIssues;
    issuesToCheck.forEach((issue) => {
      paths.add(issue.filePath);
    });
    return Array.from(paths).sort();
  }, [_originalIssues, filteredIssues]);
  const filterStatistics = useMemo(() => {
    const baseIssues = _originalIssues.length > 0 ? _originalIssues : filteredIssues;
    return dashboardService.getFilterStatistics(baseIssues, processedIssues, filters);
  }, [_originalIssues, filteredIssues, processedIssues, filters, dashboardService]);
  const hasActiveFilters = useMemo(() => {
    return filters.severity.length < 3 || filters.tools.length > 0 || filters.filePaths.length > 0 || filters.fixable !== null || filters.minScore !== null || filters.maxScore !== null || filters.searchQuery.trim() !== "";
  }, [filters]);
  return {
    filters,
    processedIssues,
    hasActiveFilters,
    filterStatistics,
    availableSeverities: getAvailableSeverities(),
    setSeverityFilter,
    toggleSeverity,
    availableTools: getAvailableTools(),
    setToolFilter,
    toggleTool,
    availableFilePaths: getAvailableFilePaths(),
    setFilePathFilter,
    addFilePath,
    removeFilePath,
    setScoreRange,
    toggleFixable,
    setSearchQuery,
    clearAllFilters
  };
}
var init_useFilters = __esm(() => {
  init_useDashboardStore();
  init_dashboard_service();
});

// src/hooks/useNavigation.ts
import React4, { useCallback as useCallback2 } from "react";
import { useInput as useInput3 } from "ink";
function useMenuNavigation(itemCount, onSelect, onCancel, isOpen) {
  const [selectedIndex, setSelectedIndex] = React4.useState(0);
  const menuNavigation = createMenuNavigation(itemCount, onSelect, onCancel);
  const _handleKeyDown = useCallback2((key, currentIndex) => {
    const result = menuNavigation.handleKeyDown(key, currentIndex);
    if (result.action === "select") {
      onSelect(result.index);
      return result.index;
    } else if (result.action === "cancel") {
      onCancel();
      return currentIndex;
    } else {
      return result.index;
    }
  }, [menuNavigation, onSelect, onCancel]);
  useInput3((_input, key) => {
    if (!isOpen)
      return;
    let newIndex = selectedIndex;
    if (key.upArrow || _input === "k") {
      newIndex = Math.max(0, selectedIndex - 1);
    } else if (key.downArrow || _input === "j") {
      newIndex = Math.min(itemCount - 1, selectedIndex + 1);
    } else if (key.ctrl && _input === "a") {
      newIndex = 0;
    } else if (key.ctrl && _input === "e") {
      newIndex = itemCount - 1;
    } else if (key.return || _input === " ") {
      onSelect(selectedIndex);
      return;
    } else if (key.escape) {
      onCancel();
      return;
    } else if (_input >= "1" && _input <= "9") {
      const numericIndex = parseInt(_input) - 1;
      if (numericIndex < itemCount) {
        newIndex = numericIndex;
        onSelect(numericIndex);
        return;
      }
    }
    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
    }
  });
  React4.useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);
  return {
    selectedIndex,
    setSelectedIndex
  };
}
var init_useNavigation = __esm(() => {
  init_useDashboardStore();
  init_keyboard_navigation();
});

// src/components/dashboard/filter-menu.tsx
import { useState as useState2 } from "react";
import { Box as Box8, Text as Text8, useInput as useInput4 } from "ink";
import { jsxDEV as jsxDEV8 } from "react/jsx-dev-runtime";
function FilterMenu({ isOpen, onClose }) {
  if (!isOpen)
    return null;
  const {
    filters,
    availableSeverities,
    availableTools,
    toggleSeverity,
    toggleTool,
    toggleFixable,
    setSearchQuery,
    clearAllFilters
  } = useFilters();
  const { toggleFilterMenu } = useDashboardStore();
  const [searchQuery, setSearchQueryState] = useState2(filters.searchQuery);
  const [currentSection, setCurrentSection] = useState2("severity");
  const severityItems = availableSeverities.length;
  const toolItems = Math.min(availableTools.length, 10);
  const fixableItems = 1;
  const searchItems = 1;
  const actionItems = 2;
  const totalItems = severityItems + toolItems + fixableItems + searchItems + actionItems;
  const { selectedIndex } = useMenuNavigation(totalItems, (index) => handleMenuAction(index), onClose, isOpen);
  const handleMenuAction = (index) => {
    let currentOffset = 0;
    if (index < severityItems) {
      const severity = availableSeverities[index];
      if (severity) {
        toggleSeverity(severity);
      }
      return;
    }
    currentOffset += severityItems;
    if (index < currentOffset + toolItems) {
      const toolIndex = index - currentOffset;
      if (toolIndex < availableTools.length) {
        const tool = availableTools[toolIndex];
        if (tool) {
          toggleTool(tool);
        }
      }
      return;
    }
    currentOffset += toolItems;
    if (index < currentOffset + fixableItems) {
      toggleFixable();
      return;
    }
    currentOffset += fixableItems;
    if (index < currentOffset + searchItems) {
      setCurrentSection("search");
      return;
    }
    currentOffset += searchItems;
    if (index < currentOffset + actionItems) {
      const actionIndex = index - currentOffset;
      if (actionIndex === 0) {
        clearAllFilters();
        setSearchQueryState("");
      } else if (actionIndex === 1) {
        setSearchQuery(searchQuery);
        onClose();
        toggleFilterMenu();
      }
      return;
    }
  };
  useInput4((input, key) => {
    if (currentSection === "search" && isOpen) {
      if (key.return) {
        setSearchQuery(searchQuery);
        setCurrentSection("severity");
        return;
      } else if (key.escape) {
        setSearchQueryState(filters.searchQuery);
        setCurrentSection("severity");
        return;
      } else if (key.backspace || key.delete) {
        setSearchQueryState((prev) => prev.slice(0, -1));
        return;
      } else if (input && !key.ctrl && !key.meta) {
        setSearchQueryState((prev) => prev + input);
        return;
      }
    }
  });
  const renderSeveritySection = () => /* @__PURE__ */ jsxDEV8(Box8, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsxDEV8(Box8, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV8(Text8, {
          bold: true,
          color: "cyan",
          children: "Severity Filter"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      availableSeverities.map((severity, index) => {
        const isSelected = filters.severity.includes(severity);
        const isHighlighted = currentSection === "severity" && index === selectedIndex;
        return /* @__PURE__ */ jsxDEV8(Box8, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ? "white" : "gray",
              children: [
                "[",
                isSelected ? "✓" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: getSeverityColor(severity),
              children: [
                " ",
                getSeveritySymbol(severity)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ? "white" : "reset",
              children: [
                " ",
                severity.charAt(0).toUpperCase() + severity.slice(1)
              ]
            }, undefined, true, undefined, this)
          ]
        }, severity, true, undefined, this);
      })
    ]
  }, undefined, true, undefined, this);
  const renderToolsSection = () => /* @__PURE__ */ jsxDEV8(Box8, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsxDEV8(Box8, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV8(Text8, {
            bold: true,
            color: "cyan",
            children: "Tools Filter"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV8(Text8, {
            color: "gray",
            dimColor: true,
            children: [
              " ",
              "(showing first ",
              Math.min(availableTools.length, 10),
              " of ",
              availableTools.length,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      availableTools.slice(0, 10).map((tool, index) => {
        const isSelected = filters.tools.includes(tool);
        const _itemIndex = availableSeverities.length + index;
        const isHighlighted = currentSection === "tools" && index === selectedIndex - availableSeverities.length;
        return /* @__PURE__ */ jsxDEV8(Box8, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ? "white" : "gray",
              children: [
                "[",
                isSelected ? "✓" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ? "white" : "reset",
              children: [
                " ",
                tool
              ]
            }, undefined, true, undefined, this)
          ]
        }, tool, true, undefined, this);
      })
    ]
  }, undefined, true, undefined, this);
  const renderFixableSection = () => {
    const fixableIndex = availableSeverities.length + Math.min(availableTools.length, 10);
    const isHighlighted = currentSection === "fixable" && selectedIndex === fixableIndex;
    return /* @__PURE__ */ jsxDEV8(Box8, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV8(Text8, {
            bold: true,
            color: "cyan",
            children: "Fixable Filter"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ? "white" : "gray",
              children: [
                "[",
                filters.fixable === true ? "✓" : filters.fixable === false ? "✗" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ? "white" : "reset",
              children: [
                " ",
                filters.fixable === true ? "Fixable only" : filters.fixable === false ? "Non-fixable only" : "All issues"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  const renderSearchSection = () => {
    const searchIndex = availableSeverities.length + Math.min(availableTools.length, 10) + 1;
    const isHighlighted = currentSection === "search" && selectedIndex === searchIndex;
    return /* @__PURE__ */ jsxDEV8(Box8, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV8(Text8, {
            bold: true,
            color: "cyan",
            children: "Search Filter"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: isHighlighted ?? currentSection === "search" ? "white" : "gray",
              children: [
                "[",
                currentSection === "search" ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: currentSection === "search" ? "white" : "reset",
              children: [
                " ",
                searchQuery ?? "(type to search...)"
              ]
            }, undefined, true, undefined, this),
            currentSection === "search" && /* @__PURE__ */ jsxDEV8(Text8, {
              color: "gray",
              dimColor: true,
              children: [
                " ",
                "[Enter to apply, Esc to cancel]"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  const renderActionsSection = () => {
    const actionStartIndex = availableSeverities.length + Math.min(availableTools.length, 10) + 2;
    const clearIndex = actionStartIndex;
    const applyIndex = actionStartIndex + 1;
    return /* @__PURE__ */ jsxDEV8(Box8, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV8(Text8, {
            bold: true,
            color: "cyan",
            children: "Actions"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: selectedIndex === clearIndex ? "white" : "gray",
              children: [
                "[",
                selectedIndex === clearIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: selectedIndex === clearIndex ? "white" : "reset",
              children: " Clear all filters"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: selectedIndex === applyIndex ? "white" : "gray",
              children: [
                "[",
                selectedIndex === applyIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV8(Text8, {
              color: selectedIndex === applyIndex ? "white" : "green",
              children: " Apply filters"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  return /* @__PURE__ */ jsxDEV8(Box8, {
    flexDirection: "column",
    borderStyle: "double",
    borderColor: "blue",
    padding: 1,
    children: [
      /* @__PURE__ */ jsxDEV8(Box8, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV8(Text8, {
          bold: true,
          color: "blue",
          children: "Filter Options"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      renderSeveritySection(),
      renderToolsSection(),
      renderFixableSection(),
      renderSearchSection(),
      renderActionsSection(),
      /* @__PURE__ */ jsxDEV8(Box8, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV8(Text8, {
          color: "gray",
          dimColor: true,
          children: "↑↓ Navigate | Space: Toggle | Enter: Select | Esc: Close"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_filter_menu = __esm(() => {
  init_useFilters();
  init_useNavigation();
  init_useDashboardStore();
  init_color_coding();
});

// src/services/export/export-service.ts
import { writeFileSync as writeFileSync3, mkdirSync as mkdirSync2 } from "node:fs";
import { dirname as dirname2, resolve } from "node:path";

class ExportService {
  supportedFormats = [
    {
      id: "json",
      name: "JSON",
      description: "Machine-readable JSON format",
      extension: "json",
      mimeType: "application/json",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "txt",
      name: "Plain Text",
      description: "Human-readable text format",
      extension: "txt",
      mimeType: "text/plain",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "csv",
      name: "CSV",
      description: "Comma-separated values for spreadsheet analysis",
      extension: "csv",
      mimeType: "text/csv",
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false
    },
    {
      id: "md",
      name: "Markdown",
      description: "Markdown format for documentation",
      extension: "md",
      mimeType: "text/markdown",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "junit",
      name: "JUnit XML",
      description: "JUnit XML format for CI/CD integration",
      extension: "xml",
      mimeType: "application/xml",
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false
    }
  ];
  getSupportedFormats() {
    return [...this.supportedFormats];
  }
  async exportResults(request, onProgress) {
    const { format, data, options: options2 } = request;
    const { analysisResult, filteredIssues: coreFilteredIssues, metrics } = data;
    const filteredIssues = coreFilteredIssues.map((issue) => transformCoreIssueToCLI(issue));
    try {
      onProgress?.({
        currentStep: "Preparing data",
        percentage: 10
      });
      const supportedFormat = this.supportedFormats.find((f) => f.id === format.id);
      if (!supportedFormat) {
        throw new Error(`Unsupported export format: ${format.id}`);
      }
      onProgress?.({
        currentStep: "Generating content",
        percentage: 30
      });
      let content;
      switch (format.id) {
        case "json":
          content = this.generateJSON(analysisResult, filteredIssues, metrics, options2);
          break;
        case "txt":
          content = this.generateText(analysisResult, filteredIssues, metrics, options2);
          break;
        case "csv":
          content = this.generateCSV(filteredIssues, options2);
          break;
        case "md":
          content = this.generateMarkdown(analysisResult, filteredIssues, metrics, options2);
          break;
        case "junit":
          content = this.generateJUnitXML(analysisResult, filteredIssues, options2);
          break;
        default:
          throw new Error(`Export format ${format.id} not implemented`);
      }
      onProgress?.({
        currentStep: "Writing file",
        percentage: 70
      });
      const outputPath = this.getOutputPath(analysisResult, format, options2.outputPath);
      onProgress?.({
        currentStep: "Finalizing",
        percentage: 90,
        bytesWritten: content.length
      });
      const outputDir = dirname2(outputPath);
      mkdirSync2(outputDir, { recursive: true });
      writeFileSync3(outputPath, content, "utf-8");
      onProgress?.({
        currentStep: "Complete",
        percentage: 100,
        bytesWritten: content.length
      });
      return {
        success: true,
        outputPath,
        size: Buffer.byteLength(content, "utf-8"),
        format,
        timestamp: new Date
      };
    } catch (error) {
      return {
        success: false,
        outputPath: "",
        size: 0,
        format,
        timestamp: new Date,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  generateJSON(analysisResult, filteredIssues, metrics, _options) {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        tool: "DevQuality CLI"
      }
    };
    if (_options.includeSummary) {
      exportData.summary = {
        projectId: analysisResult.projectId,
        timestamp: analysisResult.timestamp,
        duration: analysisResult.duration,
        overallScore: analysisResult.overallScore,
        totalIssues: metrics.totalIssues,
        errorCount: metrics.errorCount,
        warningCount: metrics.warningCount,
        infoCount: metrics.infoCount,
        fixableCount: metrics.fixableCount,
        toolsAnalyzed: metrics.toolsAnalyzed,
        coverage: metrics.coverage
      };
    }
    if (_options.includeMetrics) {
      exportData.metrics = metrics;
    }
    if (_options.includeIssues) {
      const issuesToExport = _options.includeFixed ? filteredIssues : filteredIssues.filter((issue) => !issue.fixable);
      exportData.issues = issuesToExport;
    }
    return JSON.stringify(exportData, null, 2);
  }
  generateText(analysisResult, filteredIssues, metrics, _options) {
    const lines = [];
    lines.push("=".repeat(80));
    lines.push("DevQuality CLI Analysis Report");
    lines.push("=".repeat(80));
    lines.push("");
    if (_options.includeSummary) {
      lines.push("ANALYSIS SUMMARY");
      lines.push("-".repeat(40));
      lines.push(`Project ID: ${analysisResult.projectId}`);
      lines.push(`Timestamp: ${analysisResult.timestamp}`);
      lines.push(`Duration: ${(analysisResult.duration / 1000).toFixed(2)}s`);
      lines.push(`Overall Score: ${analysisResult.overallScore}/100`);
      lines.push("");
      lines.push("ISSUES SUMMARY");
      lines.push("-".repeat(40));
      lines.push(`Total Issues: ${metrics.totalIssues}`);
      lines.push(`Errors: ${metrics.errorCount}`);
      lines.push(`Warnings: ${metrics.warningCount}`);
      lines.push(`Info: ${metrics.infoCount}`);
      lines.push(`Fixable: ${metrics.fixableCount}`);
      lines.push("");
    }
    if (_options.includeIssues) {
      const issuesToExport = _options.includeFixed ? filteredIssues : filteredIssues.filter((issue) => !issue.fixable);
      lines.push(`ISSUES (${issuesToExport.length})`);
      lines.push("-".repeat(40));
      lines.push("");
      issuesToExport.forEach((issue, index) => {
        lines.push(`${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
        lines.push(`   File: ${issue.filePath}:${issue.lineNumber}`);
        lines.push(`   Tool: ${issue.toolName}`);
        lines.push(`   Score: ${issue.score}`);
        if (issue.ruleId) {
          lines.push(`   Rule: ${issue.ruleId}`);
        }
        if (issue.suggestion) {
          lines.push(`   Suggestion: ${issue.suggestion}`);
        }
        lines.push(`   Fixable: ${issue.fixable ? "Yes" : "No"}`);
        lines.push("");
      });
    }
    return lines.join(`
`);
  }
  generateCSV(filteredIssues, _options) {
    const issuesToExport = _options.includeFixed ? filteredIssues : filteredIssues.filter((issue) => !issue.fixable);
    const headers = [
      "Type",
      "Severity",
      "Tool",
      "File",
      "Line",
      "Message",
      "Rule ID",
      "Score",
      "Fixable",
      "Suggestion"
    ];
    const rows = issuesToExport.map((issue) => [
      issue.type,
      issue.type,
      issue.toolName,
      issue.filePath,
      issue.lineNumber.toString(),
      `"${issue.message.replace(/"/g, '""')}"`,
      issue.ruleId ?? "",
      issue.score.toString(),
      issue.fixable.toString(),
      `"${(issue.suggestion ?? "").replace(/"/g, '""')}"`
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join(`
`);
  }
  generateMarkdown(analysisResult, filteredIssues, metrics, _options) {
    const lines = [];
    lines.push("# DevQuality CLI Analysis Report");
    lines.push("");
    if (_options.includeSummary) {
      lines.push("## Analysis Summary");
      lines.push("");
      lines.push(`- **Project ID**: ${analysisResult.projectId}`);
      lines.push(`- **Timestamp**: ${analysisResult.timestamp}`);
      lines.push(`- **Duration**: ${(analysisResult.duration / 1000).toFixed(2)}s`);
      lines.push(`- **Overall Score**: ${analysisResult.overallScore}/100`);
      lines.push("");
      lines.push("### Issues Summary");
      lines.push("");
      lines.push("| Metric | Count |");
      lines.push("|--------|-------|");
      lines.push(`| Total Issues | ${metrics.totalIssues} |`);
      lines.push(`| Errors | ${metrics.errorCount} |`);
      lines.push(`| Warnings | ${metrics.warningCount} |`);
      lines.push(`| Info | ${metrics.infoCount} |`);
      lines.push(`| Fixable | ${metrics.fixableCount} |`);
      lines.push("");
    }
    if (_options.includeIssues) {
      const issuesToExport = _options.includeFixed ? filteredIssues : filteredIssues.filter((issue) => !issue.fixable);
      lines.push(`## Issues (${issuesToExport.length})`);
      lines.push("");
      issuesToExport.forEach((issue, index) => {
        const severityEmoji = issue.type === "error" ? "\uD83D\uDD34" : issue.type === "warning" ? "\uD83D\uDFE1" : "\uD83D\uDD35";
        lines.push(`### ${index + 1}. ${severityEmoji} ${issue.type.toUpperCase()}`);
        lines.push("");
        lines.push(`**Message**: ${issue.message}`);
        lines.push(`**File**: \`${issue.filePath}:${issue.lineNumber}\``);
        lines.push(`**Tool**: ${issue.toolName}`);
        lines.push(`**Score**: ${issue.score}`);
        if (issue.ruleId) {
          lines.push(`**Rule**: \`${issue.ruleId}\``);
        }
        if (issue.suggestion) {
          lines.push(`**Suggestion**: ${issue.suggestion}`);
        }
        lines.push(`**Fixable**: ${issue.fixable ? "✅ Yes" : "❌ No"}`);
        lines.push("");
      });
    }
    return lines.join(`
`);
  }
  generateJUnitXML(analysisResult, filteredIssues, _options) {
    const issuesToExport = _options.includeFixed ? filteredIssues : filteredIssues.filter((issue) => !issue.fixable);
    const errorCount = issuesToExport.filter((issue) => issue.type === "error").length;
    const failureCount = issuesToExport.filter((issue) => issue.type === "warning").length;
    const xmlLines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<testsuites name="DevQuality Analysis" tests="${issuesToExport.length}" failures="${failureCount}" errors="${errorCount}" time="${(analysisResult.duration / 1000).toFixed(2)}">`,
      `  <testsuite name="Code Quality" tests="${issuesToExport.length}" failures="${failureCount}" errors="${errorCount}" time="${(analysisResult.duration / 1000).toFixed(2)}">`
    ];
    issuesToExport.forEach((issue, index) => {
      const testCaseName = `testCase${index + 1}`;
      const className = issue.filePath.replace(/[^a-zA-Z0-9]/g, "_");
      if (issue.type === "error") {
        xmlLines.push(`    <testcase name="${testCaseName}" classname="${className}" time="0">`);
        xmlLines.push(`      <error message="${this.escapeXml(issue.message)}">`);
        xmlLines.push(`        ${this.escapeXml(`Tool: ${issue.toolName}, Line: ${issue.lineNumber}, Rule: ${issue.ruleId ?? "N/A"}`)}`);
        xmlLines.push(`      </error>`);
        xmlLines.push(`    </testcase>`);
      } else if (issue.type === "warning") {
        xmlLines.push(`    <testcase name="${testCaseName}" classname="${className}" time="0">`);
        xmlLines.push(`      <failure message="${this.escapeXml(issue.message)}">`);
        xmlLines.push(`        ${this.escapeXml(`Tool: ${issue.toolName}, Line: ${issue.lineNumber}, Rule: ${issue.ruleId ?? "N/A"}`)}`);
        xmlLines.push(`      </failure>`);
        xmlLines.push(`    </testcase>`);
      } else {
        xmlLines.push(`    <testcase name="${testCaseName}" classname="${className}" time="0"/>`);
      }
    });
    xmlLines.push("  </testsuite>");
    xmlLines.push("</testsuites>");
    return xmlLines.join(`
`);
  }
  escapeXml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  getOutputPath(analysisResult, format, customPath) {
    if (customPath) {
      return resolve(customPath);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `dev-quality-report-${analysisResult.projectId}-${timestamp}.${format.extension}`;
    return resolve(process.cwd(), filename);
  }
}
var init_export_service = () => {};

// src/services/export/report-formats.ts
function getFormatById(formatId) {
  return REPORT_FORMATS.find((format) => format.id === formatId);
}
function getOptionsForFormat(formatId) {
  const options2 = FORMAT_SPECIFIC_OPTIONS[formatId];
  return options2 ?? DEFAULT_EXPORT_OPTIONS;
}
function validateExportOptions(formatId, _options) {
  const errors = [];
  const format = getFormatById(formatId);
  if (!format) {
    errors.push(`Unknown format: ${formatId}`);
    return { valid: false, errors };
  }
  if (_options.includeSummary && !format.supportsSummary) {
    errors.push(`${format.name} does not support summary export`);
  }
  if (_options.includeMetrics && !format.supportsMetrics) {
    errors.push(`${format.name} does not support metrics export`);
  }
  if (_options.includeIssues && !format.supportsIssues) {
    errors.push(`${format.name} does not support issues export`);
  }
  return { valid: errors.length === 0, errors };
}
var REPORT_FORMATS, DEFAULT_EXPORT_OPTIONS, FORMAT_SPECIFIC_OPTIONS;
var init_report_formats = __esm(() => {
  REPORT_FORMATS = [
    {
      id: "json",
      name: "JSON",
      description: "Machine-readable JSON format with complete analysis data",
      extension: "json",
      mimeType: "application/json",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "txt",
      name: "Plain Text",
      description: "Human-readable text format suitable for terminal output",
      extension: "txt",
      mimeType: "text/plain",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "csv",
      name: "CSV",
      description: "Comma-separated values for spreadsheet analysis and data processing",
      extension: "csv",
      mimeType: "text/csv",
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false
    },
    {
      id: "md",
      name: "Markdown",
      description: "Markdown format for documentation and README files",
      extension: "md",
      mimeType: "text/markdown",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "junit",
      name: "JUnit XML",
      description: "JUnit XML format for CI/CD integration and test reporting",
      extension: "xml",
      mimeType: "application/xml",
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false
    },
    {
      id: "html",
      name: "HTML",
      description: "HTML format for web-based reporting with interactive features",
      extension: "html",
      mimeType: "text/html",
      supportsSummary: true,
      supportsIssues: true,
      supportsMetrics: true
    },
    {
      id: "sarif",
      name: "SARIF",
      description: "Static Analysis Results Interchange Format for tool integration",
      extension: "sarif",
      mimeType: "application/sarif+json",
      supportsSummary: false,
      supportsIssues: true,
      supportsMetrics: false
    }
  ];
  DEFAULT_EXPORT_OPTIONS = {
    includeSummary: true,
    includeIssues: true,
    includeMetrics: true,
    includeFixed: false
  };
  FORMAT_SPECIFIC_OPTIONS = {
    json: {
      ...DEFAULT_EXPORT_OPTIONS,
      prettyPrint: true,
      includeRawData: false
    },
    txt: {
      ...DEFAULT_EXPORT_OPTIONS,
      maxMessageLength: 120,
      includeTimestamps: true
    },
    csv: {
      ...DEFAULT_EXPORT_OPTIONS,
      includeHeaders: true,
      delimiter: ",",
      quoteFields: true
    },
    md: {
      ...DEFAULT_EXPORT_OPTIONS,
      includeTableOfContents: true,
      includeSeverityIcons: true,
      maxMessageLength: 100
    },
    junit: {
      includeSummary: false,
      includeIssues: true,
      includeMetrics: false,
      includeFixed: false,
      package: "dev-quality.analysis",
      classname: "CodeQualityTest"
    },
    html: {
      ...DEFAULT_EXPORT_OPTIONS,
      includeStyles: true,
      includeScripts: false,
      theme: "light"
    },
    sarif: {
      includeSummary: false,
      includeIssues: true,
      includeMetrics: false,
      includeFixed: false,
      version: "2.1.0",
      includeLevel: true,
      includeLocation: true
    }
  };
});

// src/hooks/useExport.ts
import { useState as useState3, useCallback as useCallback3 } from "react";
function useExport() {
  const { currentResult, filteredIssues } = useDashboardStore();
  const [isExporting, setIsExporting] = useState3(false);
  const exportService = new ExportService;
  const [exportProgress, setExportProgress] = useState3(null);
  const [lastExportResult, setLastExportResult] = useState3(null);
  const [exportError, setExportError] = useState3(null);
  const exportResults = useCallback3(async (formatId, options2 = {}) => {
    if (!currentResult) {
      const error = "No analysis results available for export";
      setExportError(error);
      const fallbackFormat = exportService.getSupportedFormats()[0];
      if (!fallbackFormat) {
        throw new Error("No export formats available");
      }
      return {
        success: false,
        outputPath: "",
        size: 0,
        format: getFormatById(formatId) ?? fallbackFormat,
        timestamp: new Date,
        error
      };
    }
    setIsExporting(true);
    setExportError(null);
    setExportProgress(null);
    try {
      const format = getFormatById(formatId);
      if (!format) {
        throw new Error(`Unknown export format: ${formatId}`);
      }
      const defaultOptions = getOptionsForFormat(formatId);
      const exportOptions = { ...defaultOptions, ...options2 };
      const validation = validateExportOptions(formatId, exportOptions);
      if (!validation.valid) {
        throw new Error(`Invalid export options: ${validation.errors.join(", ")}`);
      }
      const metrics = {
        totalIssues: filteredIssues.length,
        errorCount: filteredIssues.filter((issue) => issue.type === "error").length,
        warningCount: filteredIssues.filter((issue) => issue.type === "warning").length,
        infoCount: filteredIssues.filter((issue) => issue.type === "info").length,
        fixableCount: filteredIssues.filter((issue) => issue.fixable).length,
        overallScore: currentResult.overallScore,
        coverage: currentResult.toolResults.find((result2) => result2.coverage)?.coverage ?? null,
        toolsAnalyzed: currentResult.toolResults.length,
        duration: currentResult.duration
      };
      const exportRequest = {
        format,
        data: {
          analysisResult: currentResult,
          filteredIssues,
          metrics
        },
        options: exportOptions
      };
      const result = await exportService.exportResults(exportRequest, (progress) => {
        setExportProgress(progress);
      });
      setLastExportResult(result);
      if (!result.success) {
        setExportError(result.error ?? "Export failed");
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setExportError(errorMessage);
      const fallbackFormat = exportService.getSupportedFormats()[0];
      if (!fallbackFormat) {
        throw new Error("No export formats available");
      }
      const result = {
        success: false,
        outputPath: "",
        size: 0,
        format: getFormatById(formatId) ?? fallbackFormat,
        timestamp: new Date,
        error: errorMessage
      };
      setLastExportResult(result);
      return result;
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [currentResult, filteredIssues, exportService]);
  const exportToJSON = useCallback3((outputPath) => {
    return exportResults("json", { outputPath });
  }, [exportResults]);
  const exportToText = useCallback3((outputPath) => {
    return exportResults("txt", { outputPath });
  }, [exportResults]);
  const exportToCSV = useCallback3((outputPath) => {
    return exportResults("csv", { outputPath });
  }, [exportResults]);
  const exportToMarkdown = useCallback3((outputPath) => {
    return exportResults("md", { outputPath });
  }, [exportResults]);
  const exportToJUnit = useCallback3((outputPath) => {
    return exportResults("junit", { outputPath });
  }, [exportResults]);
  const resetExportState = useCallback3(() => {
    setIsExporting(false);
    setExportProgress(null);
    setLastExportResult(null);
    setExportError(null);
  }, []);
  return {
    isExporting,
    exportProgress,
    lastExportResult,
    exportError,
    exportResults,
    exportToJSON,
    exportToText,
    exportToCSV,
    exportToMarkdown,
    exportToJUnit,
    resetExportState,
    supportedFormats: exportService.getSupportedFormats(),
    canExport: !!currentResult
  };
}
var init_useExport = __esm(() => {
  init_useDashboardStore();
  init_export_service();
  init_report_formats();
});

// src/components/dashboard/export-menu.tsx
import { useState as useState4 } from "react";
import { Box as Box9, Text as Text9, useInput as useInput5 } from "ink";
import { jsxDEV as jsxDEV9, Fragment as Fragment3 } from "react/jsx-dev-runtime";
function ExportMenu({ isOpen, onClose }) {
  if (!isOpen)
    return null;
  const {
    supportedFormats,
    exportResults,
    isExporting,
    exportProgress,
    exportError,
    resetExportState
  } = useExport();
  const { toggleExportMenu } = useDashboardStore();
  const [selectedFormat, setSelectedFormat] = useState4(null);
  const [includeSummary, setIncludeSummary] = useState4(true);
  const [includeIssues, setIncludeIssues] = useState4(true);
  const [includeMetrics, setIncludeMetrics] = useState4(true);
  const [includeFixed, setIncludeFixed] = useState4(false);
  const formatItems = supportedFormats.length;
  const optionItems = 4;
  const actionItems = 2;
  const totalItems = formatItems + optionItems + actionItems;
  const { selectedIndex } = useMenuNavigation(totalItems, (index) => handleMenuAction(index), onClose, isOpen);
  const handleMenuAction = async (index) => {
    let currentOffset = 0;
    if (index < formatItems) {
      const format = supportedFormats[index];
      setSelectedFormat(format ?? null);
      return;
    }
    currentOffset += formatItems;
    if (index < currentOffset + optionItems) {
      const optionIndex = index - currentOffset;
      switch (optionIndex) {
        case 0:
          setIncludeSummary(!includeSummary);
          break;
        case 1:
          setIncludeIssues(!includeIssues);
          break;
        case 2:
          setIncludeMetrics(!includeMetrics);
          break;
        case 3:
          setIncludeFixed(!includeFixed);
          break;
      }
      return;
    }
    currentOffset += optionItems;
    if (index < currentOffset + actionItems) {
      const actionIndex = index - currentOffset;
      if (actionIndex === 0) {
        if (selectedFormat) {
          await performExport(selectedFormat);
        }
      } else if (actionIndex === 1) {
        resetExportState();
        onClose();
        toggleExportMenu();
      }
      return;
    }
  };
  const performExport = async (format) => {
    const result = await exportResults(format.id, {
      includeSummary,
      includeIssues,
      includeMetrics,
      includeFixed
    });
    if (result.success) {
      setTimeout(() => {
        onClose();
        toggleExportMenu();
        resetExportState();
      }, 2000);
    }
  };
  useInput5((input, key) => {
    if (key.escape && !isExporting) {
      resetExportState();
      onClose();
      toggleExportMenu();
    }
  });
  const renderFormatSection = () => /* @__PURE__ */ jsxDEV9(Box9, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsxDEV9(Box9, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV9(Text9, {
          bold: true,
          color: "cyan",
          children: "Export Format"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      supportedFormats.map((format, index) => {
        const isSelected = selectedFormat?.id === format.id;
        const isHighlighted = index === selectedIndex;
        return /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: isHighlighted ? "white" : "gray",
              children: [
                "[",
                isSelected ? "✓" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: isHighlighted ? "white" : "reset",
              children: [
                " ",
                format.name,
                " (.",
                format.extension,
                ")"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: "gray",
              dimColor: true,
              children: [
                " ",
                "- ",
                format.description
              ]
            }, undefined, true, undefined, this)
          ]
        }, format.id, true, undefined, this);
      })
    ]
  }, undefined, true, undefined, this);
  const renderOptionsSection = () => {
    const optionStartIndex = supportedFormats.length;
    return /* @__PURE__ */ jsxDEV9(Box9, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV9(Text9, {
            bold: true,
            color: "cyan",
            children: "Export Options"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex === selectedIndex ? "white" : "gray",
              children: [
                "[",
                optionStartIndex === selectedIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex === selectedIndex ? "white" : "reset",
              children: [
                " ",
                "[",
                includeSummary ? "✓" : " ",
                "] Include summary"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex + 1 === selectedIndex ? "white" : "gray",
              children: [
                "[",
                optionStartIndex + 1 === selectedIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex + 1 === selectedIndex ? "white" : "reset",
              children: [
                " ",
                "[",
                includeIssues ? "✓" : " ",
                "] Include issues"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex + 2 === selectedIndex ? "white" : "gray",
              children: [
                "[",
                optionStartIndex + 2 === selectedIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex + 2 === selectedIndex ? "white" : "reset",
              children: [
                " ",
                "[",
                includeMetrics ? "✓" : " ",
                "] Include metrics"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex + 3 === selectedIndex ? "white" : "gray",
              children: [
                "[",
                optionStartIndex + 3 === selectedIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: optionStartIndex + 3 === selectedIndex ? "white" : "reset",
              children: [
                " ",
                "[",
                includeFixed ? "✓" : " ",
                "] Include fixed issues"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  const renderActionsSection = () => {
    const actionStartIndex = supportedFormats.length + 4;
    const exportIndex = actionStartIndex;
    const cancelIndex = actionStartIndex + 1;
    return /* @__PURE__ */ jsxDEV9(Box9, {
      flexDirection: "column",
      marginBottom: 1,
      children: [
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV9(Text9, {
            bold: true,
            color: "cyan",
            children: "Actions"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: exportIndex === selectedIndex ? "white" : "gray",
              children: [
                "[",
                exportIndex === selectedIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: exportIndex === selectedIndex ? "white" : selectedFormat ? "green" : "gray",
              children: [
                " ",
                "Export ",
                selectedFormat ? `as ${selectedFormat.name}` : "(select format first)"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginLeft: 1,
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: cancelIndex === selectedIndex ? "white" : "gray",
              children: [
                "[",
                cancelIndex === selectedIndex ? ">" : " ",
                "]"
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV9(Text9, {
              color: cancelIndex === selectedIndex ? "white" : "red",
              children: " Cancel"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  const renderProgress = () => {
    if (!isExporting || !exportProgress)
      return null;
    return /* @__PURE__ */ jsxDEV9(Box9, {
      flexDirection: "column",
      marginBottom: 1,
      padding: 1,
      borderStyle: "single",
      borderColor: "blue",
      children: [
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV9(Text9, {
            bold: true,
            color: "blue",
            children: "Exporting..."
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsxDEV9(Text9, {
            children: exportProgress.currentStep
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV9(Box9, {
          children: [
            /* @__PURE__ */ jsxDEV9(Text9, {
              children: [
                "Progress: ",
                exportProgress.percentage,
                "%"
              ]
            }, undefined, true, undefined, this),
            exportProgress.bytesWritten && /* @__PURE__ */ jsxDEV9(Text9, {
              children: [
                " Size: ",
                (exportProgress.bytesWritten / 1024).toFixed(1),
                "KB"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  const renderResult = () => {
    if (!exportProgress || exportProgress.percentage < 100)
      return null;
    return /* @__PURE__ */ jsxDEV9(Box9, {
      flexDirection: "column",
      marginBottom: 1,
      padding: 1,
      borderStyle: "single",
      borderColor: exportError ? "red" : "green",
      children: exportError ? /* @__PURE__ */ jsxDEV9(Fragment3, {
        children: [
          /* @__PURE__ */ jsxDEV9(Box9, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV9(Text9, {
              bold: true,
              color: "red",
              children: "Export Failed"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV9(Text9, {
            color: "red",
            children: exportError
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV9(Fragment3, {
        children: [
          /* @__PURE__ */ jsxDEV9(Box9, {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV9(Text9, {
              bold: true,
              color: "green",
              children: "Export Complete"
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV9(Text9, {
            color: "green",
            children: "Report saved successfully!"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this);
  };
  return /* @__PURE__ */ jsxDEV9(Box9, {
    flexDirection: "column",
    borderStyle: "double",
    borderColor: "blue",
    padding: 1,
    children: [
      /* @__PURE__ */ jsxDEV9(Box9, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV9(Text9, {
          bold: true,
          color: "blue",
          children: "Export Options"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      renderFormatSection(),
      renderOptionsSection(),
      renderActionsSection(),
      renderProgress(),
      renderResult(),
      /* @__PURE__ */ jsxDEV9(Box9, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV9(Text9, {
          color: "gray",
          dimColor: true,
          children: "↑↓ Navigate | Space: Toggle | Enter: Select | Esc: Close"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_export_menu = __esm(() => {
  init_useExport();
  init_useNavigation();
  init_useDashboardStore();
});

// src/components/progress/analysis-progress.tsx
import { Box as Box10, Text as Text10 } from "ink";
import { jsxDEV as jsxDEV10 } from "react/jsx-dev-runtime";
function AnalysisProgress({ progress }) {
  const {
    totalPlugins,
    completedPlugins,
    currentPlugin,
    percentage,
    estimatedTimeRemaining,
    startTime
  } = progress;
  const elapsedMs = Date.now() - startTime.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const formatTime = (seconds) => {
    if (seconds < 60)
      return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  const createProgressBar = (current, total, width = 20) => {
    const filled = Math.floor(current / total * width);
    const empty = width - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  };
  return /* @__PURE__ */ jsxDEV10(Box10, {
    flexDirection: "column",
    padding: 1,
    borderStyle: "round",
    borderColor: "blue",
    children: [
      /* @__PURE__ */ jsxDEV10(Box10, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV10(Text10, {
          bold: true,
          color: "blue",
          children: "Analysis Progress"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV10(Box10, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV10(Text10, {
            children: [
              createProgressBar(completedPlugins, totalPlugins),
              " "
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10(Text10, {
            color: "cyan",
            children: [
              completedPlugins,
              "/",
              totalPlugins
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV10(Text10, {
            dimColor: true,
            children: " plugins"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV10(Box10, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV10(Text10, {
            children: "Percentage: "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV10(Text10, {
            color: "green",
            children: [
              percentage.toFixed(1),
              "%"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      currentPlugin && /* @__PURE__ */ jsxDEV10(Box10, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV10(Text10, {
            children: "Current: "
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV10(Text10, {
            color: "yellow",
            children: currentPlugin
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV10(Box10, {
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsxDEV10(Box10, {
            children: [
              /* @__PURE__ */ jsxDEV10(Text10, {
                children: "Elapsed: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10(Text10, {
                color: "magenta",
                children: formatTime(elapsedSeconds)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          estimatedTimeRemaining && /* @__PURE__ */ jsxDEV10(Box10, {
            children: [
              /* @__PURE__ */ jsxDEV10(Text10, {
                children: "Remaining: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV10(Text10, {
                color: "cyan",
                children: formatTime(Math.floor(estimatedTimeRemaining / 1000))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_analysis_progress = () => {};

// src/components/dashboard/dashboard.tsx
import { useEffect as useEffect2, useCallback as useCallback4 } from "react";
import { Box as Box11, Text as Text11, useInput as useInput6, useApp } from "ink";
import { jsxDEV as jsxDEV11, Fragment as Fragment4 } from "react/jsx-dev-runtime";
function Dashboard({ analysisResult }) {
  const { exit } = useApp();
  const {
    currentView,
    filteredIssues,
    selectedIssue: _selectedIssue,
    isAnalyzing,
    analysisProgress,
    ui: { isFilterMenuOpen, isExportMenuOpen },
    setAnalysisResult,
    setCurrentView,
    setSelectedIssue,
    setAnalyzing: _setAnalyzing
  } = useDashboardStore();
  useEffect2(() => {
    setAnalysisResult(analysisResult);
  }, [analysisResult, setAnalysisResult]);
  const handleNavigation = useCallback4((direction) => {
    const { selectedIndex: _selectedIndex } = useDashboardStore.getState().navigation;
    switch (direction) {
      case "escape":
        if (currentView === "issue-details") {
          setCurrentView("dashboard");
          setSelectedIssue(null);
        } else if (currentView === "dashboard" || currentView === "issue-list") {
          exit();
        }
        break;
      case "q":
        exit();
        break;
      case "f": {
        const { toggleFilterMenu } = useDashboardStore.getState();
        toggleFilterMenu();
        break;
      }
      case "e": {
        const { toggleExportMenu } = useDashboardStore.getState();
        toggleExportMenu();
        break;
      }
    }
  }, [currentView, exit, setCurrentView, setSelectedIssue]);
  useInput6((input, key) => {
    if (key.escape) {
      handleNavigation("escape");
    } else if (input === "q") {
      handleNavigation("q");
    } else if (input === "f" && !isFilterMenuOpen && !isExportMenuOpen) {
      handleNavigation("f");
    } else if (input === "e" && !isFilterMenuOpen && !isExportMenuOpen) {
      handleNavigation("e");
    }
  });
  const renderCurrentView = () => {
    switch (currentView) {
      case "issue-details":
        return /* @__PURE__ */ jsxDEV11(IssueDetails, {}, undefined, false, undefined, this);
      case "issue-list":
        return /* @__PURE__ */ jsxDEV11(IssueList, {}, undefined, false, undefined, this);
      case "dashboard":
      default:
        return /* @__PURE__ */ jsxDEV11(Fragment4, {
          children: [
            /* @__PURE__ */ jsxDEV11(MetricsSummary, {}, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV11(Box11, {
              marginBottom: 1,
              children: /* @__PURE__ */ jsxDEV11(FilterBar, {}, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV11(IssueList, {}, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this);
    }
  };
  return /* @__PURE__ */ jsxDEV11(Box11, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsxDEV11(Box11, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV11(Box11, {
          justifyContent: "space-between",
          width: "100%",
          children: [
            /* @__PURE__ */ jsxDEV11(Text11, {
              bold: true,
              color: "blue",
              children: "DevQuality Dashboard"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV11(Text11, {
              color: "gray",
              children: [
                analysisResult.projectId,
                " - Score: ",
                analysisResult.overallScore
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      isAnalyzing && analysisProgress && /* @__PURE__ */ jsxDEV11(Box11, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV11(AnalysisProgress, {
          progress: analysisProgress
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      isFilterMenuOpen && /* @__PURE__ */ jsxDEV11(Box11, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV11(FilterMenu, {
          isOpen: isFilterMenuOpen,
          onClose: () => {
            const { toggleFilterMenu } = useDashboardStore.getState();
            toggleFilterMenu();
          }
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      isExportMenuOpen && /* @__PURE__ */ jsxDEV11(Box11, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV11(ExportMenu, {
          isOpen: isExportMenuOpen,
          onClose: () => {
            const { toggleExportMenu } = useDashboardStore.getState();
            toggleExportMenu();
          }
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV11(Box11, {
        flexGrow: 1,
        children: renderCurrentView()
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV11(Box11, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV11(Box11, {
          justifyContent: "space-between",
          width: "100%",
          children: [
            /* @__PURE__ */ jsxDEV11(Text11, {
              color: "gray",
              dimColor: true,
              children: [
                "Issues: ",
                filteredIssues.length,
                " | View: ",
                currentView
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV11(Text11, {
              color: "gray",
              dimColor: true,
              children: "Press 'q' to quit, 'f' for filters, 'e' for export"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_dashboard = __esm(() => {
  init_useDashboardStore();
  init_metrics_summary();
  init_issue_list();
  init_issue_details();
  init_filters();
  init_filter_menu();
  init_export_menu();
  init_analysis_progress();
});

// src/components/dashboard/virtualized-issue-list.tsx
import { useState as useState5, useEffect as useEffect3, useMemo as useMemo2 } from "react";
import { Box as Box12, Text as Text12, useInput as useInput7 } from "ink";
import { jsxDEV as jsxDEV12 } from "react/jsx-dev-runtime";
var init_virtualized_issue_list = __esm(() => {
  init_useDashboardStore();
  init_keyboard_navigation();
  init_issue_item();
});

// src/components/dashboard/index.ts
var init_dashboard2 = __esm(() => {
  init_dashboard();
  init_metrics_summary();
  init_issue_list();
  init_issue_details();
  init_filters();
  init_filter_menu();
  init_export_menu();
  init_sort_controls();
  init_pagination();
  init_virtualized_issue_list();
});

// src/services/dashboard/dashboard-engine-integration.ts
class DashboardEngineIntegration {
  dashboardService;
  analysisEngine = null;
  eventListeners = new Map;
  constructor() {
    this.dashboardService = new DashboardService;
  }
  setAnalysisEngine(analysisEngine) {
    this.analysisEngine = analysisEngine;
    this.setupEventListeners();
  }
  setupEventListeners() {
    if (!this.analysisEngine)
      return;
    this.analysisEngine.on("analysis:progress", (projectId, progress) => {
      this.emit("progress", progress);
    });
    this.analysisEngine.on("analysis:plugin-complete", (projectId, toolName, result) => {
      this.emit("plugin-complete", { toolName, result });
    });
    this.analysisEngine.on("analysis:plugin-error", (projectId, toolName, error) => {
      this.emit("plugin-error", { toolName, error });
    });
    this.analysisEngine.on("analysis:complete", (projectId, result) => {
      const dashboardData = this.dashboardService.processResults(result);
      this.emit("analysis-complete", dashboardData);
    });
    this.analysisEngine.on("analysis:error", (projectId, error) => {
      this.emit("analysis-error", error);
    });
  }
  async executeAnalysisWithDashboard(projectId, config, options2 = {}) {
    if (!this.analysisEngine) {
      throw new Error("Analysis engine not initialized");
    }
    try {
      const cleanupListeners = this.setupTemporaryListeners(options2);
      const context = {
        projectPath: process.cwd(),
        cache: undefined,
        logger: {
          error: (_message, ..._args) => {},
          warn: (_message, ..._args) => {},
          info: (_message, ..._args) => {},
          debug: (_message, ..._args) => {}
        },
        signal: undefined,
        config
      };
      const result = await this.analysisEngine.executeAnalysis(projectId, context, {
        plugins: options2.plugins,
        incremental: options2.incremental,
        timeout: options2.timeout,
        enableCache: options2.enableCache
      });
      cleanupListeners();
      return {
        success: true,
        result: transformCoreAnalysisResultToCLI(result)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  setupTemporaryListeners(options2) {
    const listeners = [];
    if (options2.onProgress) {
      const listener = (progress) => {
        if (options2.onProgress) {
          options2.onProgress(progress);
        }
      };
      this.on("progress", listener);
      listeners.push({ event: "progress", listener });
    }
    if (options2.onPluginComplete) {
      const listener = ({ toolName, result }) => {
        if (options2.onPluginComplete) {
          options2.onPluginComplete(toolName, result);
        }
      };
      this.on("plugin-complete", listener);
      listeners.push({ event: "plugin-complete", listener });
    }
    if (options2.onPluginError) {
      const listener = ({ toolName, error }) => {
        if (options2.onPluginError) {
          options2.onPluginError(toolName, error);
        }
      };
      this.on("plugin-error", listener);
      listeners.push({ event: "plugin-error", listener });
    }
    return () => {
      listeners.forEach(({ event, listener }) => {
        this.off(event, listener);
      });
    };
  }
  getCurrentProgress() {
    return null;
  }
  async cancelAnalysis(_projectId) {
    if (!this.analysisEngine)
      return false;
    return true;
  }
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.push(listener);
    }
  }
  off(event, listener) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (_error) {}
      });
    }
  }
  transformAnalysisResult(result) {
    return this.dashboardService.processResults(result);
  }
  getDashboardService() {
    return this.dashboardService;
  }
}
var init_dashboard_engine_integration = __esm(() => {
  init_dashboard_service();
});

// src/services/analysis/mock-analysis-engine.ts
import { EventEmitter as EventEmitter6 } from "events";
var MockAnalysisEngine;
var init_mock_analysis_engine = __esm(() => {
  MockAnalysisEngine = class MockAnalysisEngine extends EventEmitter6 {
    isRunning = false;
    currentAnalysis = null;
    constructor() {
      super();
    }
    async initialize() {}
    async executeAnalysis(projectId, context, options2) {
      if (this.isRunning) {
        throw new Error("Analysis already in progress");
      }
      this.isRunning = true;
      this.currentAnalysis = projectId;
      const startTime = Date.now();
      const plugins2 = options2?.plugins ?? ["eslint", "typescript", "prettier"];
      try {
        this.emit("analysis:start", projectId);
        const totalPlugins = plugins2.length;
        for (let i = 0;i < totalPlugins; i++) {
          const pluginName = plugins2[i];
          if (!pluginName)
            continue;
          const progress = {
            totalPlugins,
            completedPlugins: i,
            currentPlugin: pluginName,
            percentage: i / totalPlugins * 100,
            startTime: new Date(startTime),
            estimatedTimeRemaining: (totalPlugins - i) * 1000
          };
          this.emit("analysis:progress", projectId, progress);
          this.emit("analysis:plugin-start", projectId, pluginName);
          await new Promise((resolve2) => setTimeout(resolve2, 500 + Math.random() * 1000));
          const toolResult = this.generateMockToolResult(pluginName);
          this.emit("analysis:plugin-complete", projectId, toolResult);
        }
        const coreResult = this.generateMockAnalysisResult(projectId, plugins2, startTime);
        const result = transformCoreAnalysisResultToCLI(coreResult);
        this.emit("analysis:complete", projectId, result);
        return coreResult;
      } catch (error) {
        this.emit("analysis:error", projectId, error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        this.isRunning = false;
        this.currentAnalysis = null;
      }
    }
    generateMockToolResult(toolName) {
      const issueCount = Math.floor(Math.random() * 20) + 5;
      const issues = [];
      for (let i = 0;i < issueCount; i++) {
        const types = ["error", "warning", "info"];
        const type = types[Math.floor(Math.random() * types.length)];
        issues.push({
          id: `${toolName}-${i}-${Date.now()}`,
          type,
          toolName,
          filePath: this.generateMockFilePath(),
          lineNumber: Math.floor(Math.random() * 100) + 1,
          message: this.generateMockMessage(type),
          ruleId: `${toolName}-${type}-${i}`,
          fixable: Math.random() > 0.5,
          suggestion: Math.random() > 0.7 ? this.generateMockSuggestion() : undefined,
          score: Math.floor(Math.random() * 100) + 1
        });
      }
      const errorCount = issues.filter((i) => i.type === "error").length;
      const warningCount = issues.filter((i) => i.type === "warning").length;
      const infoCount = issues.filter((i) => i.type === "info").length;
      const fixableCount = issues.filter((i) => i.fixable).length;
      return {
        toolName,
        executionTime: 500 + Math.random() * 1000,
        status: Math.random() > 0.1 ? "success" : "warning",
        issues,
        metrics: {
          issuesCount: issues.length,
          errorsCount: errorCount,
          warningsCount: warningCount,
          infoCount,
          fixableCount,
          score: Math.floor(Math.random() * 100) + 1
        },
        coverage: toolName === "typescript" ? this.generateMockCoverage() : undefined
      };
    }
    generateMockAnalysisResult(projectId, plugins2, startTime) {
      const toolResults = plugins2.map((tool) => this.generateMockToolResult(tool));
      const allIssues = toolResults.flatMap((result) => result.issues);
      const totalErrors = allIssues.filter((issue) => issue.type === "error").length;
      const totalWarnings = allIssues.filter((issue) => issue.type === "warning").length;
      const totalFixable = allIssues.filter((issue) => issue.fixable).length;
      const overallScore = Math.max(0, 100 - totalErrors * 10 - totalWarnings * 3 - allIssues.length * 0.5);
      return {
        id: `analysis-${projectId}-${Date.now()}`,
        projectId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        overallScore: Math.round(overallScore),
        toolResults,
        summary: {
          totalIssues: allIssues.length,
          totalErrors,
          totalWarnings,
          totalFixable,
          overallScore: Math.round(overallScore),
          toolCount: plugins2.length,
          executionTime: Date.now() - startTime
        },
        aiPrompts: []
      };
    }
    generateMockFilePath() {
      const paths = [
        "src/components/dashboard.tsx",
        "src/hooks/useDashboardStore.ts",
        "src/services/dashboard/dashboard-service.ts",
        "src/utils/color-coding.ts",
        "src/types/dashboard.ts",
        "src/index.ts",
        "tests/unit/dashboard.test.ts",
        "docs/README.md"
      ];
      const randomPath = paths[Math.floor(Math.random() * paths.length)];
      return randomPath ?? "src/index.ts";
    }
    generateMockMessage(type) {
      const messages = {
        error: [
          "Unexpected token in expression",
          "Type assertion is not allowed",
          "Cannot find module declaration",
          "Function must have a return type",
          "Variable is used before assignment"
        ],
        warning: [
          "Unused variable detected",
          "Missing dependency in useEffect",
          "Function is missing dependency array",
          "Type assertion may be unsafe",
          "Import is not used"
        ],
        info: [
          "Consider using useCallback for optimization",
          "File could benefit from better documentation",
          "Consider breaking down large function",
          "Add type annotations for better safety",
          "Consider using const instead of let"
        ]
      };
      const typeMessages = messages[type] ?? messages.info;
      const randomMessage = typeMessages[Math.floor(Math.random() * typeMessages.length)];
      return randomMessage ?? "Code quality issue detected";
    }
    generateMockSuggestion() {
      const suggestions = [
        "Add proper error handling",
        "Consider refactoring into smaller functions",
        "Add type annotations",
        "Remove unused imports",
        "Add JSDoc comments",
        "Use more descriptive variable names",
        "Consider using early return pattern",
        "Add input validation"
      ];
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      return randomSuggestion ?? "Consider refactoring this code";
    }
    generateMockCoverage() {
      return {
        lines: {
          total: 1000,
          covered: Math.floor(Math.random() * 500) + 500,
          percentage: Math.random() * 40 + 60
        },
        functions: {
          total: 100,
          covered: Math.floor(Math.random() * 50) + 50,
          percentage: Math.random() * 30 + 70
        },
        branches: {
          total: 200,
          covered: Math.floor(Math.random() * 100) + 100,
          percentage: Math.random() * 35 + 65
        },
        statements: {
          total: 1200,
          covered: Math.floor(Math.random() * 600) + 600,
          percentage: Math.random() * 25 + 75
        }
      };
    }
  };
});

// src/hooks/useAnalysisResults.ts
import { useState as useState6, useEffect as useEffect4, useCallback as useCallback5 } from "react";
function useAnalysisResults() {
  const { setAnalysisResult, setAnalysisProgress, setAnalyzing, updateFilteredIssues } = useDashboardStore();
  const [integration] = useState6(() => new DashboardEngineIntegration);
  const [analysisError, setAnalysisError] = useState6(null);
  const [lastAnalysisData, setLastAnalysisData] = useState6(null);
  useEffect4(() => {
    const initializeEngine = async () => {
      try {
        const mockEngine = new MockAnalysisEngine;
        await mockEngine.initialize();
        integration.setAnalysisEngine(mockEngine);
      } catch (error) {
        setAnalysisError(error instanceof Error ? error : new Error(String(error)));
      }
    };
    initializeEngine();
  }, [integration]);
  const executeAnalysis = useCallback5(async (projectId, config, options2 = {}) => {
    setAnalysisError(null);
    setAnalyzing(true);
    setAnalysisProgress(null);
    try {
      const onProgress = (progress) => {
        setAnalysisProgress(progress);
      };
      const result = await integration.executeAnalysisWithDashboard(projectId, config, {
        ...options2,
        onProgress,
        onPluginComplete: (_toolName, _toolResult) => {},
        onPluginError: (_toolName, _error) => {}
      });
      if (result.success && result.result) {
        const dashboardData = integration.transformAnalysisResult(result.result);
        setAnalysisResult(result.result);
        updateFilteredIssues(dashboardData.filteredIssues);
        setLastAnalysisData(dashboardData);
      } else {
        setAnalysisError(result.error ?? new Error("Analysis failed"));
      }
      return result;
    } catch (error) {
      const analysisError2 = error instanceof Error ? error : new Error(String(error));
      setAnalysisError(analysisError2);
      return {
        success: false,
        error: analysisError2
      };
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(null);
    }
  }, [integration, setAnalysisResult, setAnalysisProgress, setAnalyzing, updateFilteredIssues]);
  const cancelAnalysis = useCallback5(async (projectId) => {
    try {
      const cancelled = await integration.cancelAnalysis(projectId);
      if (cancelled) {
        setAnalyzing(false);
        setAnalysisProgress(null);
      }
      return cancelled;
    } catch (_error) {
      return false;
    }
  }, [integration, setAnalyzing, setAnalysisProgress]);
  const loadResults = useCallback5((result) => {
    const dashboardData = integration.transformAnalysisResult(result);
    setAnalysisResult(result);
    updateFilteredIssues(dashboardData.filteredIssues);
    setLastAnalysisData(dashboardData);
    setAnalysisError(null);
  }, [integration, setAnalysisResult, updateFilteredIssues]);
  const clearResults = useCallback5(() => {
    setAnalysisResult(null);
    updateFilteredIssues([]);
    setLastAnalysisData(null);
    setAnalysisError(null);
    setAnalysisProgress(null);
    setAnalyzing(false);
  }, [setAnalysisResult, updateFilteredIssues]);
  useEffect4(() => {
    const handleProgress = (progress) => {
      setAnalysisProgress(progress);
    };
    const handleComplete = (dashboardData) => {
      setLastAnalysisData(dashboardData);
      setAnalyzing(false);
    };
    const handleError = (error) => {
      setAnalysisError(error);
      setAnalyzing(false);
    };
    integration.on("progress", handleProgress);
    integration.on("analysis-complete", handleComplete);
    integration.on("analysis-error", handleError);
    return () => {
      integration.off("progress", handleProgress);
      integration.off("analysis-complete", handleComplete);
      integration.off("analysis-error", handleError);
    };
  }, [integration, setAnalysisProgress, setAnalyzing]);
  return {
    analysisError,
    lastAnalysisData,
    isAnalyzing: useDashboardStore((state) => state.isAnalyzing),
    executeAnalysis,
    cancelAnalysis,
    loadResults,
    clearResults,
    integration
  };
}
var init_useAnalysisResults = __esm(() => {
  init_useDashboardStore();
  init_dashboard_engine_integration();
  init_mock_analysis_engine();
});

// src/commands/dashboard.ts
var exports_dashboard = {};
__export(exports_dashboard, {
  DashboardCommand: () => DashboardCommand
});
import React11 from "react";
import { render as render2 } from "ink";
var DashboardCommand;
var init_dashboard3 = __esm(() => {
  init_dashboard2();
  init_useAnalysisResults();
  DashboardCommand = class DashboardCommand extends BaseCommand {
    constructor(options2) {
      super(options2);
    }
    async execute() {
      const dashboardOptions = this.options;
      this.log("Launching DevQuality Dashboard...");
      try {
        const DashboardWrapper = () => {
          const { executeAnalysis, loadResults, analysisError, isAnalyzing } = useAnalysisResults();
          const [analysisResult, setAnalysisResult] = React11.useState(null);
          React11.useEffect(() => {
            this.getAnalysisResult().then(setAnalysisResult).catch((error) => {
              this.log(`Failed to load analysis result: ${error}`, "error");
            });
          }, []);
          React11.useEffect(() => {
            if (dashboardOptions.autoAnalyze !== false) {
              this.runAnalysis(executeAnalysis, loadResults);
            }
          }, []);
          if (analysisError) {
            return React11.createElement("div", {}, [
              React11.createElement("h1", {}, "Dashboard Error"),
              React11.createElement("p", {}, analysisError.message)
            ]);
          }
          if (isAnalyzing || !analysisResult) {
            return React11.createElement("div", {}, [
              React11.createElement("h1", {}, isAnalyzing ? "Analyzing..." : "Loading..."),
              React11.createElement("p", {}, isAnalyzing ? "Please wait while we analyze your code quality." : "Please wait while we load the results.")
            ]);
          }
          return React11.createElement(Dashboard, {
            analysisResult
          });
        };
        const { waitUntilExit } = render2(React11.createElement(DashboardWrapper));
        await waitUntilExit();
        this.log("Dashboard session ended");
      } catch (error) {
        this.log(`Dashboard failed: ${error instanceof Error ? error.message : error}`, "error");
        throw error;
      }
    }
    async runAnalysis(executeAnalysis, loadResults) {
      try {
        const config = await this.loadConfig();
        const dashboardOptions = this.options;
        const plugins2 = dashboardOptions.tools ? dashboardOptions.tools.split(",") : undefined;
        const result = await executeAnalysis("dashboard-project", config, {
          plugins: plugins2
        });
        if (result["success"] && result["result"]) {
          loadResults(result["result"]);
        }
      } catch (error) {
        this.log(`Auto-analysis failed: ${error instanceof Error ? error.message : error}`, "warn");
      }
    }
    async getAnalysisResult() {
      const dashboardOptions = this.options;
      if (dashboardOptions.input) {
        try {
          const { readFileSync: readFileSync3 } = await import("node:fs");
          const content = readFileSync3(dashboardOptions.input, "utf-8");
          const result = JSON.parse(content);
          return result;
        } catch (error) {
          this.log(`Failed to load results from ${dashboardOptions.input}: ${error}`, "warn");
        }
      }
      return {
        id: "mock-dashboard-analysis",
        projectId: "dashboard-project",
        timestamp: new Date().toISOString(),
        duration: 5000,
        overallScore: 78,
        toolResults: [
          {
            toolName: "eslint",
            executionTime: 1500,
            status: "success",
            issues: [
              {
                id: "eslint-1",
                type: "warning",
                toolName: "eslint",
                filePath: "src/components/dashboard.tsx",
                lineNumber: 45,
                message: 'Unused variable "example"',
                ruleId: "no-unused-vars",
                fixable: true,
                suggestion: "Remove the unused variable or use it in your code",
                score: 25
              },
              {
                id: "eslint-2",
                type: "error",
                toolName: "eslint",
                filePath: "src/hooks/useDashboardStore.ts",
                lineNumber: 23,
                message: "Missing return type annotation",
                ruleId: "@typescript-eslint/explicit-function-return-type",
                fixable: true,
                suggestion: "Add explicit return type annotation",
                score: 50
              }
            ],
            metrics: {
              issuesCount: 2,
              errorsCount: 1,
              warningsCount: 1,
              infoCount: 0,
              fixableCount: 2,
              score: 75
            }
          },
          {
            toolName: "typescript",
            executionTime: 2000,
            status: "success",
            issues: [
              {
                id: "ts-1",
                type: "error",
                toolName: "typescript",
                filePath: "src/types/dashboard.ts",
                lineNumber: 15,
                message: 'Type "any" is not allowed',
                ruleId: "no-explicit-any",
                fixable: true,
                suggestion: 'Use proper type annotations instead of "any"',
                score: 60
              }
            ],
            metrics: {
              issuesCount: 1,
              errorsCount: 1,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 1,
              score: 85
            },
            coverage: {
              lines: { total: 500, covered: 425, percentage: 85 },
              functions: { total: 50, covered: 45, percentage: 90 },
              branches: { total: 100, covered: 80, percentage: 80 },
              statements: { total: 600, covered: 510, percentage: 85 }
            }
          }
        ],
        summary: {
          totalIssues: 3,
          totalErrors: 2,
          totalWarnings: 1,
          totalFixable: 3,
          overallScore: 78,
          toolCount: 2,
          executionTime: 3500
        },
        aiPrompts: []
      };
    }
  };
});

// src/components/watch.tsx
var exports_watch = {};
__export(exports_watch, {
  WatchComponent: () => WatchComponent
});
import { useState as useState7, useEffect as useEffect5 } from "react";
import { Box as Box14, Text as Text14, useApp as useApp3 } from "ink";
import { jsxDEV as jsxDEV14 } from "react/jsx-dev-runtime";
function WatchComponent(props) {
  const { exit } = useApp3();
  const [isRunning, setIsRunning] = useState7(true);
  const [lastRun, setLastRun] = useState7(null);
  const [analysisCount, setAnalysisCount] = useState7(0);
  useEffect5(() => {
    if (!isRunning)
      return;
    const intervalMs = parseInt(props.interval ?? "5000");
    const interval = setInterval(() => {
      setLastRun(new Date);
      setAnalysisCount((prev) => prev + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isRunning, props.interval]);
  useEffect5(() => {
    const handleKeyPress = (data) => {
      if (data === "q") {
        setIsRunning(false);
        exit();
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", handleKeyPress);
    return () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("data", handleKeyPress);
    };
  }, [exit]);
  return /* @__PURE__ */ jsxDEV14(Box14, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsxDEV14(Box14, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          bold: true,
          color: "blue",
          children: "DevQuality Watch Mode"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV14(Box14, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          children: "Monitoring for changes..."
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV14(Box14, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          dimColor: true,
          children: "Press 'q' to quit"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV14(Box14, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          color: "green",
          children: [
            "Status: ",
            isRunning ? "Running" : "Stopped"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      lastRun && /* @__PURE__ */ jsxDEV14(Box14, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          children: [
            "Last run: ",
            lastRun.toLocaleTimeString()
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV14(Box14, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          children: [
            "Analyses completed: ",
            analysisCount
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV14(Box14, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV14(Text14, {
          dimColor: true,
          children: [
            "Interval: ",
            props.interval ?? "5000",
            "ms | Debounce: ",
            props.debounce ?? "1000",
            "ms"
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var init_watch = () => {};

// src/commands/export.ts
var exports_export = {};
__export(exports_export, {
  ExportCommand: () => ExportCommand
});
var ExportCommand;
var init_export = __esm(() => {
  ExportCommand = class ExportCommand extends BaseCommand {
    constructor(options2) {
      super(options2);
    }
    async execute() {
      this.log("Export functionality will be implemented in a future version.");
    }
    async loadConfig() {
      throw new Error("Export command does not load configuration");
    }
  };
});

// src/commands/history.ts
var exports_history = {};
__export(exports_history, {
  HistoryCommand: () => HistoryCommand
});
var HistoryCommand;
var init_history = __esm(() => {
  HistoryCommand = class HistoryCommand extends BaseCommand {
    constructor(options2) {
      super(options2);
    }
    async execute() {
      this.log("History functionality will be implemented in a future version.");
    }
    async loadConfig() {
      throw new Error("History command does not load configuration");
    }
  };
});

// ../../node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import__.default;

// src/index.ts
import { render as render3 } from "ink";
import React13 from "react";
// package.json
var version = "0.0.0";
// ../../packages/core/src/index.ts
init_esm();

// ../../packages/core/src/detection/project-detector.ts
import { existsSync as existsSync2 } from "node:fs";
import { join as join2 } from "node:path";

// ../../packages/utils/src/index.ts
import { join, dirname, basename, extname, relative } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
var pathUtils = {
  join,
  dirname,
  basename,
  extname,
  relative,
  getAppDataPath: (appName) => {
    const platform = process.platform;
    const home = homedir();
    if (platform === "darwin") {
      return join(home, "Library", "Application Support", appName);
    }
    if (platform === "win32") {
      return join(home, "AppData", "Roaming", appName);
    }
    return join(home, ".local", "share", appName);
  },
  ensureDir: (dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },
  getConfigPath: (configName) => {
    return join(process.cwd(), configName);
  }
};
var fileUtils = {
  readJsonSync: (filePath) => {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  },
  writeJsonSync: (filePath, data) => {
    const content = JSON.stringify(data, null, 2);
    writeFileSync(filePath, content, "utf-8");
  },
  existsSync,
  findFileUp: (fileName, startDir = process.cwd()) => {
    let currentDir = startDir;
    while (currentDir !== dirname(currentDir)) {
      const filePath = join(currentDir, fileName);
      if (existsSync(filePath)) {
        return filePath;
      }
      currentDir = dirname(currentDir);
    }
    return null;
  }
};

// ../../packages/core/src/detection/project-detector.ts
class ProjectDetector {
  FRAMEWORK_PATTERNS = {
    react: ["react", "react-dom", "@types/react", "next", "gatsby", "remix"],
    vue: ["vue", "nuxt", "@nuxt/core", "quasar"],
    angular: ["@angular/core", "@angular/common", "@angular/platform-browser"],
    svelte: ["svelte", "svelte-kit"],
    node: ["express", "fastify", "koa", "nestjs", "hapi"]
  };
  BUILD_SYSTEMS = [
    { name: "vite", files: ["vite.config.ts", "vite.config.js"] },
    { name: "webpack", files: ["webpack.config.js", "webpack.config.ts"] },
    { name: "rollup", files: ["rollup.config.js", "rollup.config.ts"] },
    { name: "next", files: ["next.config.js", "next.config.ts"] },
    { name: "nuxt", files: ["nuxt.config.ts", "nuxt.config.js"] },
    { name: "angular", files: ["angular.json"] },
    { name: "parcel", files: [".parcelrc"] }
  ];
  async detectProject(rootPath) {
    const packageJsonPath = join2(rootPath, "package.json");
    if (!existsSync2(packageJsonPath)) {
      throw new Error("No package.json found in project root");
    }
    const packageJson = this.parsePackageJson(packageJsonPath);
    const projectType = this.determineProjectType(packageJson, rootPath);
    const frameworks = this.detectFrameworks(packageJson);
    const buildSystems = this.detectBuildSystems(rootPath);
    const packageManager = this.detectPackageManager(rootPath);
    const hasTypeScript = this.hasTypeScript(packageJson, rootPath);
    const hasTests = this.hasTests(packageJson, rootPath);
    return {
      name: packageJson.name || "unknown-project",
      version: packageJson.version || "1.0.0",
      description: packageJson.description || "",
      type: projectType,
      frameworks,
      buildSystems,
      packageManager,
      hasTypeScript,
      hasTests,
      isMonorepo: projectType === "monorepo",
      root: rootPath
    };
  }
  parsePackageJson(packageJsonPath) {
    try {
      return fileUtils.readJsonSync(packageJsonPath);
    } catch (error) {
      throw new Error(`Failed to parse package.json: ${error}`);
    }
  }
  determineProjectType(packageJson, rootPath) {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depNames = Object.keys(dependencies);
    if (packageJson.workspaces || this.hasMonorepoConfig(rootPath)) {
      return "monorepo";
    }
    const frontendFrameworks = ["react", "vue", "angular", "svelte"];
    const hasFrontendDeps = frontendFrameworks.some((framework) => depNames.some((dep) => dep.includes(framework)));
    const backendFrameworks = ["express", "fastify", "koa", "nestjs", "hapi"];
    const hasBackendDeps = backendFrameworks.some((framework) => depNames.some((dep) => dep.includes(framework)));
    if (hasFrontendDeps && hasBackendDeps) {
      return "fullstack";
    } else if (hasFrontendDeps) {
      return "frontend";
    } else {
      return "backend";
    }
  }
  detectFrameworks(packageJson) {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depNames = Object.keys(dependencies);
    const frameworks = [];
    for (const [framework, patterns] of Object.entries(this.FRAMEWORK_PATTERNS)) {
      if (patterns.some((pattern) => depNames.some((dep) => dep.includes(pattern)))) {
        frameworks.push(framework);
      }
    }
    return frameworks;
  }
  detectBuildSystems(rootPath) {
    const buildSystems = [];
    for (const system of this.BUILD_SYSTEMS) {
      for (const file of system.files) {
        if (existsSync2(join2(rootPath, file))) {
          buildSystems.push(system.name);
          break;
        }
      }
    }
    return buildSystems;
  }
  detectPackageManager(rootPath) {
    if (existsSync2(join2(rootPath, "bun.lockb"))) {
      return "bun";
    }
    if (existsSync2(join2(rootPath, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (existsSync2(join2(rootPath, "yarn.lock"))) {
      return "yarn";
    }
    return "npm";
  }
  hasTypeScript(packageJson, rootPath) {
    const hasTypeScriptDep = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }).some((dep) => dep === "typescript" || dep.startsWith("@types/"));
    const hasTsConfig = existsSync2(join2(rootPath, "tsconfig.json")) || existsSync2(join2(rootPath, "jsconfig.json"));
    return hasTypeScriptDep || hasTsConfig;
  }
  hasTests(packageJson, rootPath) {
    const testScripts = packageJson.scripts ? Object.keys(packageJson.scripts).filter((key) => key.includes("test") || key.includes("spec")) : [];
    const testDeps = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }).filter((dep) => dep.includes("jest") || dep.includes("vitest") || dep.includes("mocha") || dep.includes("cypress") || dep.includes("playwright") || dep.includes("test") || dep.includes("bun-test"));
    const hasTestDir = existsSync2(join2(rootPath, "test")) || existsSync2(join2(rootPath, "tests")) || existsSync2(join2(rootPath, "__tests__"));
    return testScripts.length > 0 || testDeps.length > 0 || hasTestDir;
  }
  hasMonorepoConfig(rootPath) {
    const monorepoFiles = [
      "pnpm-workspace.yaml",
      "nx.json",
      "turbo.json",
      "lerna.json",
      "rush.json"
    ];
    return monorepoFiles.some((file) => existsSync2(join2(rootPath, file)));
  }
}

// ../../packages/core/src/detection/tool-detector.ts
import { existsSync as existsSync3 } from "node:fs";
import { join as join3, basename as basename2, extname as extname2 } from "node:path";
class ToolDetector {
  TOOL_CONFIGS = [
    {
      tool: "eslint",
      configs: [
        ".eslintrc",
        ".eslintrc.json",
        ".eslintrc.yaml",
        ".eslintrc.yml",
        ".eslintrc.js",
        "eslint.config.js"
      ],
      versionDep: "eslint"
    },
    {
      tool: "prettier",
      configs: [
        ".prettierrc",
        ".prettierrc.json",
        ".prettierrc.yaml",
        ".prettierrc.yml",
        ".prettierrc.js",
        ".prettierrc.toml"
      ],
      versionDep: "prettier"
    },
    {
      tool: "typescript",
      configs: ["tsconfig.json", "jsconfig.json"],
      versionDep: "typescript"
    },
    {
      tool: "jest",
      configs: [
        "jest.config.js",
        "jest.config.ts",
        "jest.config.json",
        "jest.config.mjs",
        "jest.config.cjs"
      ],
      versionDep: "jest"
    },
    {
      tool: "vitest",
      configs: ["vitest.config.ts", "vitest.config.js", "vitest.workspace.ts"],
      versionDep: "vitest"
    },
    {
      tool: "cypress",
      configs: ["cypress.config.js", "cypress.config.ts"],
      versionDep: "cypress"
    },
    {
      tool: "playwright",
      configs: ["playwright.config.js", "playwright.config.ts"],
      versionDep: "@playwright/test"
    },
    {
      tool: "webpack",
      configs: [
        "webpack.config.js",
        "webpack.config.ts",
        "webpack.config.mjs",
        "webpack.config.cjs"
      ],
      versionDep: "webpack"
    },
    {
      tool: "vite",
      configs: ["vite.config.js", "vite.config.ts"],
      versionDep: "vite"
    },
    {
      tool: "rollup",
      configs: ["rollup.config.js", "rollup.config.ts"],
      versionDep: "rollup"
    },
    {
      tool: "next",
      configs: ["next.config.js", "next.config.ts", "next.config.mjs"],
      versionDep: "next"
    },
    {
      tool: "nuxt",
      configs: ["nuxt.config.ts", "nuxt.config.js"],
      versionDep: "nuxt"
    },
    {
      tool: "tailwind",
      configs: ["tailwind.config.js", "tailwind.config.ts"],
      versionDep: "tailwindcss"
    },
    {
      tool: "postcss",
      configs: ["postcss.config.js", "postcss.config.ts", "postcss.config.mjs"],
      versionDep: "postcss"
    },
    {
      tool: "babel",
      configs: ["babel.config.js", "babel.config.json", ".babelrc", ".babelrc.js"],
      versionDep: "@babel/core"
    }
  ];
  async detectTools(rootPath) {
    const detectedTools = [];
    const packageJson = this.loadPackageJson(rootPath);
    for (const toolConfig of this.TOOL_CONFIGS) {
      const tool = await this.detectSingleTool(rootPath, toolConfig, packageJson);
      if (tool) {
        detectedTools.push(tool);
      }
    }
    return detectedTools.sort((a, b) => a.priority - b.priority);
  }
  async detectConfigs(rootPath) {
    const configFiles = [];
    for (const toolConfig of this.TOOL_CONFIGS) {
      for (const configFile of toolConfig.configs) {
        const configPath = join3(rootPath, configFile);
        if (existsSync3(configPath)) {
          try {
            const configContent = this.parseConfigFile(configPath);
            configFiles.push({
              path: configPath,
              format: this.getConfigFormat(configFile),
              tool: toolConfig.tool,
              config: configContent
            });
          } catch (error) {
            console.warn(`Failed to parse config file ${configPath}:`, error);
          }
        }
      }
    }
    return configFiles;
  }
  async detectSingleTool(rootPath, toolConfig, packageJson) {
    const configPath = this.findConfigPath(rootPath, toolConfig.configs);
    if (!configPath) {
      return null;
    }
    try {
      const version2 = this.extractVersion(packageJson, toolConfig.versionDep);
      const configContent = this.parseConfigFile(configPath);
      return {
        name: toolConfig.tool,
        version: version2 || "unknown",
        configPath,
        configFormat: this.getConfigFormat(basename2(configPath)),
        enabled: true,
        priority: this.getToolPriority(toolConfig.tool),
        config: configContent
      };
    } catch (error) {
      console.warn(`Failed to detect tool ${toolConfig.tool}:`, error);
      return null;
    }
  }
  findConfigPath(rootPath, configFiles) {
    for (const configFile of configFiles) {
      const configPath = join3(rootPath, configFile);
      if (existsSync3(configPath)) {
        return configPath;
      }
    }
    return null;
  }
  parseConfigFile(configPath) {
    const format = this.getConfigFormat(basename2(configPath));
    switch (format) {
      case "json":
        return fileUtils.readJsonSync(configPath);
      case "js":
      case "ts":
        return { _type: format, _path: configPath };
      case "yaml":
        return { _type: format, _path: configPath };
      default:
        return { _type: "unknown", _path: configPath };
    }
  }
  getConfigFormat(filename) {
    const ext = extname2(filename).toLowerCase();
    switch (ext) {
      case ".json":
        return "json";
      case ".js":
        return "js";
      case ".ts":
        return "ts";
      case ".yaml":
      case ".yml":
        return "yaml";
      default:
        if (filename.endsWith(".json"))
          return "json";
        if (filename.endsWith(".js"))
          return "js";
        if (filename.endsWith(".ts"))
          return "ts";
        if (filename.endsWith(".yaml") || filename.endsWith(".yml"))
          return "yaml";
        return "json";
    }
  }
  extractVersion(packageJson, depName) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies
    };
    return allDeps[depName] || null;
  }
  getToolPriority(toolName) {
    const priorities = {
      typescript: 1,
      eslint: 2,
      prettier: 3,
      jest: 4,
      vitest: 4,
      webpack: 5,
      vite: 5,
      rollup: 5,
      next: 6,
      nuxt: 6,
      tailwind: 7,
      postcss: 7,
      babel: 8,
      cypress: 9,
      playwright: 9
    };
    return priorities[toolName] || 99;
  }
  loadPackageJson(rootPath) {
    const packageJsonPath = join3(rootPath, "package.json");
    if (!existsSync3(packageJsonPath)) {
      return {};
    }
    try {
      return fileUtils.readJsonSync(packageJsonPath);
    } catch (error) {
      console.warn(`Failed to load package.json:`, error);
      return {};
    }
  }
}

// ../../packages/core/src/detection/dependency-checker.ts
class DependencyChecker {
  COMPATIBILITY_MATRIX = {
    typescript: {
      minimum: "4.9.0",
      recommended: "5.3.3",
      incompatible: ["<4.9.0"]
    },
    eslint: {
      minimum: "8.0.0",
      recommended: "8.57.0",
      incompatible: ["<8.0.0"]
    },
    prettier: {
      minimum: "2.0.0",
      recommended: "3.0.0",
      incompatible: ["<2.0.0"]
    },
    jest: {
      minimum: "29.0.0",
      recommended: "29.7.0",
      incompatible: ["<29.0.0"]
    },
    vitest: {
      minimum: "0.34.0",
      recommended: "1.0.0",
      incompatible: ["<0.34.0"]
    },
    webpack: {
      minimum: "5.0.0",
      recommended: "5.89.0",
      incompatible: ["<5.0.0"]
    },
    vite: {
      minimum: "4.0.0",
      recommended: "5.0.0",
      incompatible: ["<4.0.0"]
    },
    react: {
      minimum: "16.8.0",
      recommended: "18.2.0",
      incompatible: ["<16.8.0"]
    },
    next: {
      minimum: "13.0.0",
      recommended: "14.0.0",
      incompatible: ["<13.0.0"]
    }
  };
  VERSION_CONFLICTS = {
    "typescript@<4.9.0": ["next@>=13.0.0", "react@>=18.0.0"],
    "typescript@>=5.0.0": ["some-old-framework@<2.0.0"],
    "react@<16.8.0": ["react-hooks@>=1.0.0"],
    "react@>=18.0.0": ["some-old-library@<1.0.0"],
    "webpack@<5.0.0": ["webpack-dev-server@>=4.0.0"],
    "vite@<3.0.0": ["@vitejs/plugin-react@>=2.0.0"]
  };
  async detectDependencies(rootPath) {
    const packageJson = this.loadPackageJson(rootPath);
    const dependencies = [];
    const depTypeMap = {
      dependencies: "dependency",
      devDependencies: "devDependency",
      peerDependencies: "peerDependency",
      optionalDependencies: "devDependency"
    };
    const depTypes = Object.keys(depTypeMap);
    for (const depType of depTypes) {
      if (packageJson[depType]) {
        for (const [name, version2] of Object.entries(packageJson[depType])) {
          const compatibility = this.checkDependencyCompatibility(name, version2);
          const issues = this.getCompatibilityIssues(name, version2);
          dependencies.push({
            name,
            version: version2,
            type: depTypeMap[depType],
            compatibility,
            issues
          });
        }
      }
    }
    return dependencies;
  }
  async checkCompatibility(deps) {
    const issues = [];
    const recommendations = [];
    let compatible = true;
    for (const dep of deps) {
      if (dep.compatibility === "incompatible") {
        compatible = false;
        issues.push(...dep.issues);
      }
    }
    const conflicts = this.checkVersionConflicts(deps);
    if (conflicts.length > 0) {
      compatible = false;
      issues.push(...conflicts);
    }
    const upgradeRecommendations = this.generateUpgradeRecommendations(deps);
    recommendations.push(...upgradeRecommendations);
    return {
      compatible,
      issues: [...new Set(issues)],
      recommendations: [...new Set(recommendations)]
    };
  }
  getMinimumVersion(tool) {
    return this.COMPATIBILITY_MATRIX[tool]?.minimum || "0.0.0";
  }
  getRecommendedVersion(tool) {
    return this.COMPATIBILITY_MATRIX[tool]?.recommended || "latest";
  }
  checkDependencyCompatibility(name, version2) {
    const matrix = this.COMPATIBILITY_MATRIX[name];
    if (!matrix) {
      return "unknown";
    }
    const cleanVersion = this.cleanVersion(version2);
    const minVersion = matrix.minimum;
    const incompatibleVersions = matrix.incompatible || [];
    for (const incompatible of incompatibleVersions) {
      if (this.satisfiesVersion(cleanVersion, incompatible)) {
        return "incompatible";
      }
    }
    if (this.compareVersions(cleanVersion, minVersion) < 0) {
      return "incompatible";
    }
    return "compatible";
  }
  getCompatibilityIssues(name, version2) {
    const issues = [];
    const matrix = this.COMPATIBILITY_MATRIX[name];
    if (!matrix) {
      return issues;
    }
    const cleanVersion = this.cleanVersion(version2);
    const minVersion = matrix.minimum;
    if (this.compareVersions(cleanVersion, minVersion) < 0) {
      issues.push(`${name}@${version2} is below minimum required version ${minVersion}`);
    }
    return issues;
  }
  checkVersionConflicts(deps) {
    const conflicts = [];
    const depMap = new Map(deps.map((d) => [d.name, d.version]));
    for (const [conflictPattern, conflictingDeps] of Object.entries(this.VERSION_CONFLICTS)) {
      const [depName, versionRange] = conflictPattern.split("@");
      if (!depName || !versionRange)
        continue;
      const currentDep = depMap.get(depName);
      if (currentDep && this.satisfiesVersion(currentDep, versionRange)) {
        for (const conflictingDep of conflictingDeps) {
          const [conflictingName, conflictingRange] = conflictingDep.split("@");
          if (!conflictingName || !conflictingRange)
            continue;
          const conflictingVersion = depMap.get(conflictingName);
          if (conflictingVersion && this.satisfiesVersion(conflictingVersion, conflictingRange)) {
            conflicts.push(`Version conflict: ${depName}@${currentDep} conflicts with ${conflictingName}@${conflictingVersion}`);
          }
        }
      }
    }
    return conflicts;
  }
  generateUpgradeRecommendations(deps) {
    const recommendations = [];
    for (const dep of deps) {
      const matrix = this.COMPATIBILITY_MATRIX[dep.name];
      if (matrix && dep.compatibility === "incompatible") {
        const recommended = matrix.recommended;
        recommendations.push(`Upgrade ${dep.name} from ${dep.version} to ${recommended}`);
      }
    }
    return recommendations;
  }
  cleanVersion(version2) {
    return version2.replace(/^[\^~]/, "").replace(/-.*$/, "").split(" ")[0] || "0.0.0";
  }
  compareVersions(version1, version2) {
    const v1 = version1.split(".").map(Number);
    const v2 = version2.split(".").map(Number);
    for (let i = 0;i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 > num2)
        return 1;
      if (num1 < num2)
        return -1;
    }
    return 0;
  }
  satisfiesVersion(version2, range) {
    const cleanVersion = this.cleanVersion(version2);
    if (range.startsWith(">=")) {
      return this.compareVersions(cleanVersion, range.substring(2)) >= 0;
    } else if (range.startsWith(">")) {
      return this.compareVersions(cleanVersion, range.substring(1)) > 0;
    } else if (range.startsWith("<=")) {
      return this.compareVersions(cleanVersion, range.substring(2)) <= 0;
    } else if (range.startsWith("<")) {
      return this.compareVersions(cleanVersion, range.substring(1)) < 0;
    } else if (range.includes("-")) {
      const [min, max] = range.split("-");
      if (!min || !max)
        return false;
      return this.compareVersions(cleanVersion, min) >= 0 && this.compareVersions(cleanVersion, max) <= 0;
    } else {
      return cleanVersion === range;
    }
  }
  loadPackageJson(rootPath) {
    const packageJsonPath = `${rootPath}/package.json`;
    try {
      return fileUtils.readJsonSync(packageJsonPath);
    } catch (error) {
      return {};
    }
  }
}

// ../../packages/core/src/detection/structure-analyzer.ts
import { existsSync as existsSync4, readdirSync, readFileSync as readFileSync2 } from "node:fs";
import { join as join4, relative as relative2 } from "node:path";
class StructureAnalyzer {
  MONOREPO_PATTERNS = {
    npm: ["package.json", "workspaces"],
    yarn: ["package.json", "workspaces"],
    pnpm: ["pnpm-workspace.yaml"],
    nx: ["nx.json"],
    turbo: ["turbo.json"],
    lerna: ["lerna.json"],
    rush: ["rush.json"]
  };
  SOURCE_PATTERNS = [
    "src",
    "lib",
    "source",
    "app",
    "components",
    "pages",
    "views",
    "services",
    "utils",
    "helpers",
    "hooks",
    "types",
    "interfaces"
  ];
  TEST_PATTERNS = [
    "test",
    "tests",
    "__tests__",
    "spec",
    "specs",
    "e2e",
    "integration",
    "unit"
  ];
  CONFIG_PATTERNS = ["config", "configs", ".config", "configuration", "conf"];
  async analyzeStructure(rootPath) {
    const isMonorepo = this.detectMonorepo(rootPath);
    const workspaceType = isMonorepo ? await this.detectMonorepoType(rootPath) : null;
    const packages = isMonorepo ? await this.detectPackages(rootPath) : [];
    const sourceDirectories = await this.findDirectoriesByPatterns(rootPath, this.SOURCE_PATTERNS);
    const testDirectories = await this.findDirectoriesByPatterns(rootPath, this.TEST_PATTERNS);
    const configDirectories = await this.findDirectoriesByPatterns(rootPath, this.CONFIG_PATTERNS);
    const structure = {
      isMonorepo,
      workspaceType,
      packages,
      sourceDirectories,
      testDirectories,
      configDirectories,
      complexity: "simple"
    };
    structure.complexity = this.calculateComplexity(structure);
    return structure;
  }
  async detectMonorepoType(rootPath) {
    for (const [type, patterns] of Object.entries(this.MONOREPO_PATTERNS)) {
      if (type === "npm" || type === "yarn")
        continue;
      for (const pattern of patterns) {
        if (existsSync4(join4(rootPath, pattern))) {
          return type;
        }
      }
    }
    const packageJsonPath = join4(rootPath, "package.json");
    if (existsSync4(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync(packageJsonPath);
        if (pkgJson.workspaces) {
          const packageManager = this.detectPackageManager(rootPath);
          return packageManager === "yarn" ? "yarn" : "npm";
        }
      } catch (error) {
        console.warn("Failed to read package.json for monorepo type detection:", error);
      }
    }
    return null;
  }
  detectMonorepo(rootPath) {
    const packageJsonPath = join4(rootPath, "package.json");
    if (existsSync4(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync(packageJsonPath);
        if (pkgJson.workspaces) {
          return true;
        }
      } catch (error) {
        console.warn("Failed to read package.json:", error);
      }
    }
    const monorepoFiles = [
      "pnpm-workspace.yaml",
      "nx.json",
      "turbo.json",
      "lerna.json",
      "rush.json"
    ];
    return monorepoFiles.some((file) => existsSync4(join4(rootPath, file)));
  }
  async detectPackages(rootPath) {
    const packages = [];
    const packageJsonPath = join4(rootPath, "package.json");
    if (existsSync4(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync(packageJsonPath);
        if (pkgJson.workspaces) {
          const workspaces = pkgJson.workspaces;
          if (Array.isArray(workspaces)) {
            packages.push(...workspaces);
          } else if (workspaces.packages) {
            packages.push(...workspaces.packages);
          }
        }
      } catch (error) {}
    }
    const pnpmWorkspacePath = join4(rootPath, "pnpm-workspace.yaml");
    if (existsSync4(pnpmWorkspacePath)) {
      try {
        const content = readFileSync2(pnpmWorkspacePath, "utf-8");
        const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*[^\n]+\n?)*)/);
        if (packagesMatch && packagesMatch[1]) {
          const packageLines = packagesMatch[1].split(`
`).filter((line) => line.trim());
          for (const line of packageLines) {
            const packagePath = line.replace(/^\s*-\s*/, "").trim();
            if (packagePath) {
              packages.push(packagePath);
            }
          }
        }
      } catch (error) {}
    }
    const allPackageDirs = await this.findPackageDirectories(rootPath);
    packages.push(...allPackageDirs.filter((dir) => dir !== "."));
    return [...new Set(packages)];
  }
  async findPackageDirectories(rootPath) {
    const packageDirs = [];
    const scanDirectory = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join4(dir, entry.name);
          const packageJsonPath = join4(fullPath, "package.json");
          if (existsSync4(packageJsonPath)) {
            const relativePath = relative2(rootPath, fullPath);
            packageDirs.push(relativePath);
          }
          if (entry.name !== "node_modules") {
            scanDirectory(fullPath);
          }
        }
      }
    };
    scanDirectory(rootPath);
    return packageDirs;
  }
  async findDirectoriesByPatterns(rootPath, patterns) {
    const directories = [];
    const scanDirectory = (dir, currentDepth = 0) => {
      if (currentDepth > 3)
        return;
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join4(dir, entry.name);
          const relativePath = relative2(rootPath, fullPath);
          if (patterns.some((pattern) => entry.name === pattern || entry.name.includes(pattern) || entry.name.toLowerCase().includes(pattern.toLowerCase()))) {
            directories.push(relativePath);
          }
          if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
            scanDirectory(fullPath, currentDepth + 1);
          }
        }
      }
    };
    scanDirectory(rootPath);
    return [...new Set(directories)];
  }
  detectPackageManager(rootPath) {
    const packageJsonPath = join4(rootPath, "package.json");
    if (!existsSync4(packageJsonPath)) {
      return "npm";
    }
    if (existsSync4(join4(rootPath, "bun.lockb"))) {
      return "bun";
    }
    if (existsSync4(join4(rootPath, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (existsSync4(join4(rootPath, "yarn.lock"))) {
      return "yarn";
    }
    if (existsSync4(join4(rootPath, "bun.lock"))) {
      return "bun";
    }
    if (existsSync4(join4(rootPath, "package-lock.json"))) {
      return "npm";
    }
    return "npm";
  }
  calculateComplexity(structure) {
    let score = 0;
    if (structure.isMonorepo) {
      score += 3;
    }
    if (structure.packages.length > 10) {
      score += 4;
    } else if (structure.packages.length > 5) {
      score += 2;
    } else if (structure.packages.length > 2) {
      score += 1;
    }
    if (structure.sourceDirectories.length > 10) {
      score += 2;
    } else if (structure.sourceDirectories.length > 5) {
      score += 1;
    }
    if (structure.testDirectories.length > 5) {
      score += 2;
    } else if (structure.testDirectories.length > 2) {
      score += 1;
    }
    if (structure.configDirectories.length > 3) {
      score += 2;
    } else if (structure.configDirectories.length > 1) {
      score += 1;
    }
    if (structure.workspaceType === "nx" || structure.workspaceType === "rush") {
      score += 2;
    } else if (structure.workspaceType === "turbo" || structure.workspaceType === "lerna") {
      score += 1;
    }
    if (score >= 8) {
      return "complex";
    } else if (score >= 4) {
      return "medium";
    } else {
      return "simple";
    }
  }
}

// ../../packages/core/src/detection/detection-cache.ts
import { existsSync as existsSync5, statSync } from "fs";

class DetectionCache {
  fileCache;
  configCache;
  dependencyCache;
  resultCache;
  defaultTTL;
  maxCacheSize;
  constructor(options2 = {}) {
    this.fileCache = new Map;
    this.configCache = new Map;
    this.dependencyCache = new Map;
    this.resultCache = new Map;
    this.defaultTTL = options2.ttl ?? 5 * 60 * 1000;
    this.maxCacheSize = options2.maxSize ?? 1000;
  }
  getCachedFile(filePath) {
    if (!existsSync5(filePath)) {
      return null;
    }
    const cached = this.fileCache.get(filePath);
    if (!cached) {
      return null;
    }
    const stats = statSync(filePath);
    const currentMtime = stats.mtimeMs;
    if (cached.mtime !== currentMtime) {
      this.fileCache.delete(filePath);
      return null;
    }
    return cached.data;
  }
  setCachedFile(filePath, content) {
    if (!existsSync5(filePath)) {
      return;
    }
    this.ensureCacheSize(this.fileCache);
    const stats = statSync(filePath);
    this.fileCache.set(filePath, {
      data: content,
      timestamp: Date.now(),
      mtime: stats.mtimeMs
    });
  }
  getCachedConfig(key) {
    const cached = this.configCache.get(key);
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.configCache.delete(key);
      return null;
    }
    return cached.data;
  }
  setCachedConfig(key, data) {
    this.ensureCacheSize(this.configCache);
    this.configCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  getCachedDependencies(rootPath) {
    const cached = this.dependencyCache.get(rootPath);
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.dependencyCache.delete(rootPath);
      return null;
    }
    return cached.data;
  }
  setCachedDependencies(rootPath, data) {
    this.ensureCacheSize(this.dependencyCache);
    this.dependencyCache.set(rootPath, {
      data,
      timestamp: Date.now()
    });
  }
  getCachedResult(rootPath) {
    const cached = this.resultCache.get(rootPath);
    if (!cached) {
      return null;
    }
    const packageJsonPath = `${rootPath}/package.json`;
    if (existsSync5(packageJsonPath)) {
      const stats = statSync(packageJsonPath);
      if (cached.mtime && cached.mtime !== stats.mtimeMs) {
        this.resultCache.delete(rootPath);
        return null;
      }
    }
    if (Date.now() - cached.timestamp > this.defaultTTL) {
      this.resultCache.delete(rootPath);
      return null;
    }
    return cached.data;
  }
  setCachedResult(rootPath, result) {
    this.ensureCacheSize(this.resultCache);
    let mtime = 0;
    const packageJsonPath = `${rootPath}/package.json`;
    if (existsSync5(packageJsonPath)) {
      const stats = statSync(packageJsonPath);
      mtime = stats.mtimeMs;
    }
    this.resultCache.set(rootPath, {
      data: result,
      timestamp: Date.now(),
      mtime
    });
  }
  invalidate(rootPath) {
    for (const [key] of this.fileCache) {
      if (key.startsWith(rootPath)) {
        this.fileCache.delete(key);
      }
    }
    for (const [key] of this.configCache) {
      if (key.startsWith(rootPath)) {
        this.configCache.delete(key);
      }
    }
    this.dependencyCache.delete(rootPath);
    this.resultCache.delete(rootPath);
  }
  clear() {
    this.fileCache.clear();
    this.configCache.clear();
    this.dependencyCache.clear();
    this.resultCache.clear();
  }
  getStats() {
    return {
      fileCache: {
        size: this.fileCache.size,
        maxSize: this.maxCacheSize
      },
      configCache: {
        size: this.configCache.size,
        maxSize: this.maxCacheSize
      },
      dependencyCache: {
        size: this.dependencyCache.size,
        maxSize: this.maxCacheSize
      },
      resultCache: {
        size: this.resultCache.size,
        maxSize: this.maxCacheSize
      }
    };
  }
  ensureCacheSize(cache) {
    if (cache.size >= this.maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
  }
}

// ../../packages/core/src/detection/detection-engine.ts
class AutoConfigurationDetectionEngine {
  projectDetector;
  toolDetector;
  dependencyChecker;
  structureAnalyzer;
  cache;
  constructor(cache) {
    this.projectDetector = new ProjectDetector;
    this.toolDetector = new ToolDetector;
    this.dependencyChecker = new DependencyChecker;
    this.structureAnalyzer = new StructureAnalyzer;
    this.cache = cache ?? new DetectionCache;
  }
  async detectProject(rootPath) {
    return this.projectDetector.detectProject(rootPath);
  }
  async detectTools(rootPath) {
    return this.toolDetector.detectTools(rootPath);
  }
  async detectConfigs(rootPath) {
    return this.toolDetector.detectConfigs(rootPath);
  }
  async detectDependencies(rootPath) {
    return this.dependencyChecker.detectDependencies(rootPath);
  }
  async detectStructure(rootPath) {
    return this.structureAnalyzer.analyzeStructure(rootPath);
  }
  async detectAll(rootPath) {
    try {
      const cachedResult = this.cache.getCachedResult(rootPath);
      if (cachedResult) {
        return cachedResult;
      }
      const [project, tools, configs, dependencies, structure] = await Promise.all([
        this.projectDetector.detectProject(rootPath),
        this.toolDetector.detectTools(rootPath),
        this.toolDetector.detectConfigs(rootPath),
        this.dependencyChecker.detectDependencies(rootPath),
        this.structureAnalyzer.analyzeStructure(rootPath)
      ]);
      const compatibility = await this.dependencyChecker.checkCompatibility(dependencies);
      const issues = this.generateIssues(project, tools, configs, dependencies, structure, compatibility);
      const recommendations = this.generateRecommendations(project, tools, configs, dependencies, structure, compatibility);
      const result = {
        project,
        tools,
        configs,
        dependencies,
        structure,
        issues,
        recommendations,
        timestamp: new Date().toISOString()
      };
      this.cache.setCachedResult(rootPath, result);
      return result;
    } catch (error) {
      throw new Error(`Detection failed: ${error}`);
    }
  }
  clearCache(rootPath) {
    if (rootPath) {
      this.cache.invalidate(rootPath);
    } else {
      this.cache.clear();
    }
  }
  getCacheStats() {
    return this.cache.getStats();
  }
  generateIssues(project, tools, _configs, _dependencies, structure, compatibility) {
    const issues = [];
    if (project.type === "unknown") {
      issues.push("Could not determine project type");
    }
    const enabledTools = tools.filter((t) => t.enabled);
    if (enabledTools.length === 0) {
      issues.push("No development tools detected");
    }
    if (compatibility.issues.length > 0) {
      issues.push(...compatibility.issues);
    }
    if (structure.sourceDirectories.length === 0) {
      issues.push("No source directories found");
    }
    if (structure.testDirectories.length === 0) {
      issues.push("No test directories found - consider adding tests");
    }
    const hasLinting = tools.some((t) => t.name === "eslint" && t.enabled);
    const hasFormatting = tools.some((t) => t.name === "prettier" && t.enabled);
    if (!hasLinting) {
      issues.push("No linting tool detected - consider adding ESLint");
    }
    if (!hasFormatting) {
      issues.push("No formatting tool detected - consider adding Prettier");
    }
    return issues;
  }
  generateRecommendations(project, tools, _configs, _dependencies, structure, compatibility) {
    const recommendations = [];
    recommendations.push(...compatibility.recommendations);
    const toolNames = tools.map((t) => t.name);
    if (!toolNames.includes("typescript") && project.hasTypeScript) {
      recommendations.push("Add TypeScript configuration");
    }
    if (!toolNames.includes("vitest") && !toolNames.includes("jest")) {
      recommendations.push("Add a testing framework (Vitest or Jest)");
    }
    if (!toolNames.includes("eslint")) {
      recommendations.push("Add ESLint for code linting and quality checks");
    }
    if (!toolNames.includes("prettier")) {
      recommendations.push("Add Prettier for consistent code formatting");
    }
    if (structure.complexity === "complex" && !structure.isMonorepo) {
      recommendations.push("Consider converting to monorepo structure for better organization");
    }
    if (structure.packages.length > 5 && structure.workspaceType === "npm") {
      recommendations.push("Consider using pnpm or yarn workspaces for better performance");
    }
    if (toolNames.includes("eslint") && !toolNames.includes("prettier")) {
      recommendations.push("Add Prettier for consistent code formatting");
    }
    if (structure.testDirectories.length === 0) {
      recommendations.push("Set up testing structure with unit and integration tests");
    }
    return recommendations;
  }
}
// ../../packages/core/src/plugins/plugin-manager.ts
class PluginManager {
  plugins = new Map;
  pluginMetrics = new Map;
  initialized = false;
  logger;
  constructor(logger) {
    this.logger = logger;
  }
  async registerPlugin(plugin, config) {
    const pluginName = plugin.name;
    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${pluginName} depends on missing plugin: ${dep}`);
        }
      }
    }
    this.plugins.set(pluginName, plugin);
    this.pluginMetrics.set(pluginName, {
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      successCount: 0,
      errorCount: 0
    });
    this.logger.info(`Plugin ${pluginName} v${plugin.version} registered`);
  }
  async registerPlugins(plugins) {
    for (const plugin of plugins) {
      await this.registerPlugin(plugin);
    }
  }
  async initializePlugins(pluginConfigs) {
    if (this.initialized) {
      this.logger.warn("Plugin manager is already initialized");
      return;
    }
    for (const [name, plugin] of this.plugins) {
      try {
        const toolConfig = pluginConfigs[name] || plugin.getDefaultConfig();
        const validation = plugin.validateConfig(toolConfig);
        if (!validation.valid) {
          throw new Error(`Plugin configuration validation failed: ${validation.errors.join(", ")}`);
        }
        if (validation.warnings.length > 0) {
          this.logger.warn(`Plugin ${name} configuration warnings: ${validation.warnings.join(", ")}`);
        }
        const pluginConfig = {
          enabled: toolConfig.enabled,
          timeout: this.getConfigValue(toolConfig, "timeout", 30000),
          cacheEnabled: this.getConfigValue(toolConfig, "cacheEnabled", true),
          logLevel: this.getConfigValue(toolConfig, "logLevel", "info"),
          ...toolConfig.config
        };
        await plugin.initialize(pluginConfig);
        this.logger.info(`Plugin ${name} initialized successfully`);
      } catch (error) {
        this.logger.error(`Failed to initialize plugin ${name}:`, error);
        throw new Error(`Plugin initialization failed for ${name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    this.initialized = true;
    this.logger.info(`All ${this.plugins.size} plugins initialized`);
  }
  getPlugin(name) {
    return this.plugins.get(name);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  getIncrementalPlugins() {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.supportsIncremental());
  }
  getCachablePlugins() {
    return Array.from(this.plugins.values()).filter((plugin) => plugin.supportsCache());
  }
  getPluginMetrics(name) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.getMetrics) {
      return plugin.getMetrics();
    }
    return this.pluginMetrics.get(name);
  }
  getAllPluginMetrics() {
    const result = {};
    for (const [name, plugin] of this.plugins) {
      if (plugin.getMetrics) {
        result[name] = plugin.getMetrics();
      } else {
        const internalMetrics = this.pluginMetrics.get(name);
        if (internalMetrics) {
          result[name] = internalMetrics;
        }
      }
    }
    return result;
  }
  updatePluginMetrics(name, executionTime, success) {
    const metrics = this.pluginMetrics.get(name);
    if (!metrics)
      return;
    metrics.executionCount++;
    metrics.totalExecutionTime += executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executionCount;
    metrics.lastExecutionTime = new Date;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }
  }
  isInitialized() {
    return this.initialized;
  }
  getPluginCount() {
    return this.plugins.size;
  }
  hasPlugin(name) {
    return this.plugins.has(name);
  }
  async unregisterPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not registered`);
    }
    try {
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup plugin ${name}:`, error);
    }
    this.plugins.delete(name);
    this.pluginMetrics.delete(name);
    this.logger.info(`Plugin ${name} unregistered`);
  }
  async cleanup() {
    if (!this.initialized) {
      return;
    }
    for (const [name, plugin] of this.plugins) {
      try {
        if (plugin.cleanup) {
          await plugin.cleanup();
        }
      } catch (error) {
        this.logger.warn(`Failed to cleanup plugin ${name}:`, error);
      }
    }
    this.plugins.clear();
    this.pluginMetrics.clear();
    this.initialized = false;
    this.logger.info("Plugin manager cleaned up");
  }
  getConfigValue(toolConfig, key, defaultValue) {
    if (toolConfig.config && typeof toolConfig.config === "object") {
      return toolConfig.config[key] ?? defaultValue;
    }
    return defaultValue;
  }
}
// ../../packages/core/src/plugins/plugin-sandbox.ts
class PluginSandbox {
  config;
  logger;
  activePlugins = new Map;
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  async executePlugin(plugin, context, timeout) {
    const pluginName = plugin.name;
    const executionTimeout = timeout || this.config.maxExecutionTime;
    if (this.activePlugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already executing`);
    }
    this.logger.debug(`Starting sandboxed execution of plugin: ${pluginName}`);
    const startTime = Date.now();
    this.activePlugins.set(pluginName, { startTime, plugin });
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin ${pluginName} execution timed out after ${executionTimeout}ms`));
        }, executionTimeout);
      });
      const executionPromise = this.executeWithResourceMonitoring(plugin, context);
      const result = await Promise.race([executionPromise, timeoutPromise]);
      const executionTime = Date.now() - startTime;
      this.logger.debug(`Plugin ${pluginName} completed in ${executionTime}ms`);
      return {
        ...result,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Plugin ${pluginName} failed after ${executionTime}ms:`, error);
      return {
        toolName: pluginName,
        executionTime,
        status: "error",
        issues: [{
          id: `plugin-error-${Date.now()}`,
          type: "error",
          toolName: pluginName,
          filePath: "",
          lineNumber: 0,
          message: error instanceof Error ? error.message : "Unknown plugin execution error",
          fixable: false,
          score: 100
        }],
        metrics: {
          issuesCount: 1,
          errorsCount: 1,
          warningsCount: 0,
          infoCount: 0,
          fixableCount: 0,
          score: 0
        }
      };
    } finally {
      this.activePlugins.delete(pluginName);
    }
  }
  async executeWithResourceMonitoring(plugin, context) {
    this.validateContext(context);
    const initialMemory = this.getCurrentMemoryUsage();
    const maxMemoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage(plugin.name, initialMemory);
    }, 1000);
    try {
      const sandboxedContext = this.createSandboxedContext(context);
      const result = await plugin.execute(sandboxedContext);
      this.validateResult(result);
      return result;
    } finally {
      clearInterval(maxMemoryCheckInterval);
    }
  }
  validateContext(context) {
    if (!context.projectPath || typeof context.projectPath !== "string") {
      throw new Error("Invalid project path in context");
    }
    const { resolve, relative: relative3 } = __require("path");
    const relativePath = relative3(this.config.workingDirectory, context.projectPath);
    if (relativePath.startsWith("..")) {
      throw new Error("Project path is outside working directory");
    }
  }
  createSandboxedContext(context) {
    const sandboxedContext = {
      ...context,
      logger: this.createSandboxedLogger(context.logger)
    };
    if (context.cache) {
      sandboxedContext.cache = this.createSandboxedCache(context.cache);
    }
    return sandboxedContext;
  }
  createSandboxedLogger(originalLogger) {
    return {
      error: (message, ...args) => {
        this.logger.error(`[Plugin] ${message}`, ...args);
      },
      warn: (message, ...args) => {
        this.logger.warn(`[Plugin] ${message}`, ...args);
      },
      info: (message, ...args) => {
        this.logger.info(`[Plugin] ${message}`, ...args);
      },
      debug: (message, ...args) => {
        this.logger.debug(`[Plugin] ${message}`, ...args);
      }
    };
  }
  createSandboxedCache(originalCache) {
    return {
      get: async (key) => {
        if (typeof key !== "string" || key.length > 256) {
          throw new Error("Invalid cache key");
        }
        return originalCache.get(key);
      },
      set: async (key, value, ttlMs) => {
        if (typeof key !== "string" || key.length > 256) {
          throw new Error("Invalid cache key");
        }
        const valueSize = JSON.stringify(value).length;
        if (valueSize > this.config.maxFileSize) {
          throw new Error("Cache value too large");
        }
        return originalCache.set(key, value, ttlMs);
      },
      delete: async (key) => originalCache.delete(key),
      clear: async () => originalCache.clear(),
      has: async (key) => originalCache.has(key)
    };
  }
  validateResult(result) {
    if (!result || typeof result !== "object") {
      throw new Error("Invalid plugin result: not an object");
    }
    if (typeof result.toolName !== "string") {
      throw new Error("Invalid plugin result: missing or invalid toolName");
    }
    if (typeof result.executionTime !== "number" || result.executionTime < 0) {
      throw new Error("Invalid plugin result: invalid executionTime");
    }
    if (!["success", "error", "warning"].includes(result.status)) {
      throw new Error("Invalid plugin result: invalid status");
    }
    if (!Array.isArray(result.issues)) {
      throw new Error("Invalid plugin result: issues must be an array");
    }
    if (!result.metrics || typeof result.metrics !== "object") {
      throw new Error("Invalid plugin result: missing or invalid metrics");
    }
  }
  getCurrentMemoryUsage() {
    const { performance } = __require("perf_hooks");
    return performance.memory?.usedJSHeapSize || 0;
  }
  checkMemoryUsage(pluginName, initialMemory) {
    const currentMemory = this.getCurrentMemoryUsage();
    const memoryIncrease = currentMemory - initialMemory;
    if (memoryIncrease > this.config.maxMemoryUsage) {
      throw new Error(`Plugin ${pluginName} exceeded memory limit: ${memoryIncrease} bytes`);
    }
  }
  getActivePlugins() {
    return Array.from(this.activePlugins.keys());
  }
  getPluginExecutionInfo(pluginName) {
    const active = this.activePlugins.get(pluginName);
    if (!active)
      return;
    return {
      startTime: active.startTime,
      executionTime: Date.now() - active.startTime
    };
  }
  async stopPlugin(pluginName) {
    const active = this.activePlugins.get(pluginName);
    if (active) {
      this.activePlugins.delete(pluginName);
      this.logger.warn(`Forcefully stopped plugin: ${pluginName}`);
    }
  }
  async stopAllPlugins() {
    const activePlugins = Array.from(this.activePlugins.keys());
    for (const pluginName of activePlugins) {
      await this.stopPlugin(pluginName);
    }
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("Sandbox configuration updated");
  }
  getConfig() {
    return { ...this.config };
  }
}
// ../../packages/core/src/plugins/plugin-dependency-resolver.ts
class PluginDependencyResolver {
  logger;
  dependencyGraph = new Map;
  constructor(logger) {
    this.logger = logger;
  }
  addPlugin(plugin) {
    const dependencies = plugin.dependencies || [];
    this.dependencyGraph.set(plugin.name, {
      plugin,
      dependencies,
      dependents: [],
      resolved: false,
      visiting: false
    });
    for (const dep of dependencies) {
      const depNode = this.dependencyGraph.get(dep);
      if (depNode) {
        depNode.dependents.push(plugin.name);
      }
    }
    this.logger.debug(`Added plugin ${plugin.name} with dependencies: [${dependencies.join(", ")}]`);
  }
  removePlugin(pluginName) {
    const node = this.dependencyGraph.get(pluginName);
    if (!node)
      return;
    for (const dep of node.dependencies) {
      const depNode = this.dependencyGraph.get(dep);
      if (depNode) {
        depNode.dependents = depNode.dependents.filter((name) => name !== pluginName);
      }
    }
    this.dependencyGraph.delete(pluginName);
    this.logger.debug(`Removed plugin ${pluginName} from dependency graph`);
  }
  validateDependencies() {
    const errors = [];
    const warnings = [];
    for (const [name, node] of this.dependencyGraph) {
      for (const dep of node.dependencies) {
        if (!this.dependencyGraph.has(dep)) {
          errors.push(`Plugin ${name} depends on missing plugin: ${dep}`);
        }
      }
      const circularPath = this.detectCircularDependency(name);
      if (circularPath) {
        errors.push(`Circular dependency detected: ${circularPath.join(" -> ")}`);
      }
      if (node.dependencies.includes(name)) {
        errors.push(`Plugin ${name} depends on itself`);
      }
    }
    const orphanedPlugins = [];
    for (const [name, node] of this.dependencyGraph) {
      if (node.dependents.length === 0 && node.dependencies.length === 0) {
        orphanedPlugins.push(name);
      }
    }
    if (orphanedPlugins.length > 0) {
      warnings.push(`Orphaned plugins detected (no dependencies or dependents): ${orphanedPlugins.join(", ")}`);
    }
    const valid = errors.length === 0;
    if (!valid) {
      this.logger.error("Dependency validation failed:", errors);
    }
    if (warnings.length > 0) {
      this.logger.warn("Dependency validation warnings:", warnings);
    }
    return { valid, errors, warnings };
  }
  resolveExecutionOrder() {
    for (const node of this.dependencyGraph.values()) {
      node.resolved = false;
      node.visiting = false;
    }
    const executionOrder = [];
    for (const [name] of this.dependencyGraph) {
      if (!this.dependencyGraph.get(name)?.resolved) {
        this.topologicalSort(name, executionOrder);
      }
    }
    this.logger.debug(`Resolved execution order: [${executionOrder.join(" -> ")}]`);
    return executionOrder;
  }
  getParallelGroups() {
    const executionOrder = this.resolveExecutionOrder();
    const groups = [];
    const remaining = new Set(executionOrder);
    while (remaining.size > 0) {
      const currentGroup = [];
      const toRemove = [];
      for (const pluginName of remaining) {
        const node = this.dependencyGraph.get(pluginName);
        if (!node)
          continue;
        const dependenciesExecuted = node.dependencies.every((dep) => !remaining.has(dep));
        if (dependenciesExecuted) {
          currentGroup.push(pluginName);
          toRemove.push(pluginName);
        }
      }
      if (currentGroup.length === 0) {
        throw new Error("Circular dependency detected during parallel grouping");
      }
      groups.push(currentGroup);
      for (const pluginName of toRemove) {
        remaining.delete(pluginName);
      }
    }
    this.logger.debug(`Generated ${groups.length} parallel groups for execution`);
    return groups;
  }
  getDependencyLevels() {
    const levels = {};
    for (const [name] of this.dependencyGraph) {
      levels[name] = this.calculateDependencyLevel(name);
    }
    return levels;
  }
  getCriticalPath() {
    let criticalPath = [];
    let maxLength = 0;
    for (const [name] of this.dependencyGraph) {
      const path = this.getDependencyPath(name);
      if (path.length > maxLength) {
        maxLength = path.length;
        criticalPath = path;
      }
    }
    return criticalPath;
  }
  getDependents(pluginName) {
    const node = this.dependencyGraph.get(pluginName);
    return node ? [...node.dependents] : [];
  }
  getAllDependencies(pluginName) {
    const node = this.dependencyGraph.get(pluginName);
    if (!node)
      return [];
    const allDeps = new Set;
    this.collectDependenciesTransitive(pluginName, allDeps);
    return Array.from(allDeps);
  }
  checkCompatibility(plugin) {
    const errors = [];
    const warnings = [];
    for (const [name, node] of this.dependencyGraph) {
      if (name === plugin.name) {
        errors.push(`Plugin ${name} already exists`);
        continue;
      }
      if (this.detectApiConflict(node.plugin, plugin)) {
        warnings.push(`Plugin ${plugin.name} may have API conflicts with ${name}`);
      }
    }
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        const depNode = this.dependencyGraph.get(dep);
        if (depNode && !this.isVersionCompatible(plugin, depNode.plugin)) {
          errors.push(`Plugin ${plugin.name} requires incompatible version of ${dep}`);
        }
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }
  clear() {
    this.dependencyGraph.clear();
    this.logger.debug("Dependency graph cleared");
  }
  getStatistics() {
    const totalPlugins = this.dependencyGraph.size;
    let totalDependencies = 0;
    let maxDepth = 0;
    for (const node of this.dependencyGraph.values()) {
      totalDependencies += node.dependencies.length;
      const depth = this.calculateDependencyLevel(node.plugin.name);
      maxDepth = Math.max(maxDepth, depth);
    }
    const criticalPath = this.getCriticalPath();
    return {
      totalPlugins,
      totalDependencies,
      averageDependencies: totalDependencies / Math.max(totalPlugins, 1),
      maxDependencyDepth: maxDepth,
      criticalPathLength: criticalPath.length
    };
  }
  topologicalSort(pluginName, result) {
    const node = this.dependencyGraph.get(pluginName);
    if (!node)
      return;
    if (node.resolved)
      return;
    if (node.visiting) {
      throw new Error(`Circular dependency detected involving ${pluginName}`);
    }
    node.visiting = true;
    for (const dep of node.dependencies) {
      this.topologicalSort(dep, result);
    }
    node.visiting = false;
    node.resolved = true;
    result.push(pluginName);
  }
  detectCircularDependency(startName) {
    const visited = new Set;
    const path = [];
    const dfs = (pluginName) => {
      if (path.includes(pluginName)) {
        const cycleStart = path.indexOf(pluginName);
        return path.slice(cycleStart).length > 1;
      }
      if (visited.has(pluginName))
        return false;
      visited.add(pluginName);
      path.push(pluginName);
      const node = this.dependencyGraph.get(pluginName);
      if (node) {
        for (const dep of node.dependencies) {
          if (dfs(dep))
            return true;
        }
      }
      path.pop();
      return false;
    };
    return dfs(startName) ? path : null;
  }
  calculateDependencyLevel(pluginName) {
    const node = this.dependencyGraph.get(pluginName);
    if (!node || node.dependencies.length === 0)
      return 0;
    let maxLevel = 0;
    for (const dep of node.dependencies) {
      const depLevel = this.calculateDependencyLevel(dep);
      maxLevel = Math.max(maxLevel, depLevel);
    }
    return maxLevel + 1;
  }
  getDependencyPath(pluginName) {
    const node = this.dependencyGraph.get(pluginName);
    if (!node || node.dependencies.length === 0)
      return [pluginName];
    let longestPath = [pluginName];
    for (const dep of node.dependencies) {
      const depPath = this.getDependencyPath(dep);
      if (depPath.length > longestPath.length - 1) {
        longestPath = [...depPath, pluginName];
      }
    }
    return longestPath;
  }
  collectDependenciesTransitive(pluginName, result) {
    const node = this.dependencyGraph.get(pluginName);
    if (!node)
      return;
    for (const dep of node.dependencies) {
      if (!result.has(dep)) {
        result.add(dep);
        this.collectDependenciesTransitive(dep, result);
      }
    }
  }
  detectApiConflict(plugin1, plugin2) {
    return plugin1.name.toLowerCase() === plugin2.name.toLowerCase();
  }
  isVersionCompatible(plugin1, plugin2) {
    return true;
  }
}
// ../../packages/core/src/plugins/plugin-registry.ts
class PluginRegistry {
  plugins = new Map;
  logger;
  pluginPaths = [];
  constructor(logger) {
    this.logger = logger;
  }
  async registerPlugin(manifest, source, location) {
    const pluginName = manifest.metadata.name;
    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }
    try {
      this.validateManifest(manifest);
      const instance = await this.loadPluginInstance(manifest, location);
      const validation = this.validatePlugin(instance);
      const entry = {
        manifest,
        installation: {
          source,
          location,
          installedAt: new Date,
          version: manifest.metadata.version,
          dependencies: manifest.metadata.dependencies
        },
        instance,
        enabled: true,
        usageCount: 0,
        validation
      };
      this.plugins.set(pluginName, entry);
      this.logger.info(`Plugin registered: ${pluginName} v${manifest.metadata.version} from ${source}`);
    } catch (error) {
      this.logger.error(`Failed to register plugin ${pluginName}:`, error);
      throw new Error(`Plugin registration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  registerPluginInstance(plugin, source = "local" /* LOCAL */) {
    const pluginName = plugin.name;
    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }
    const manifest = {
      metadata: {
        name: plugin.name,
        version: plugin.version,
        description: `Mock plugin ${plugin.name}`,
        author: "Test",
        license: "MIT",
        keywords: ["test"],
        category: "testing",
        supportedLanguages: ["javascript"],
        supportedFileTypes: [".js"],
        dependencies: plugin.dependencies || [],
        engines: { node: ">=14.0.0" },
        compatibility: { platforms: ["*"], versions: ["*"] },
        features: {
          incremental: plugin.supportsIncremental(),
          caching: plugin.supportsCache(),
          parallel: false,
          streaming: false
        }
      },
      main: "index.js"
    };
    const validation = this.validatePlugin(plugin);
    const entry = {
      manifest,
      installation: {
        source,
        location: "mock-location",
        installedAt: new Date,
        version: plugin.version,
        dependencies: plugin.dependencies || []
      },
      instance: plugin,
      enabled: true,
      usageCount: 0,
      validation
    };
    this.plugins.set(pluginName, entry);
    this.logger.info(`Plugin registered: ${pluginName} v${plugin.version} from ${source}`);
  }
  async registerPluginsFromDirectory(directory, source = "local" /* LOCAL */) {
    const { readdir, stat } = await import("fs/promises");
    const { join: join5 } = await import("path");
    try {
      const entries = await readdir(directory);
      for (const entry of entries) {
        const entryPath = join5(directory, entry);
        const entryStat = await stat(entryPath);
        if (entryStat.isDirectory()) {
          const manifestPath = join5(entryPath, "plugin.json");
          try {
            const manifestContent = await import("fs/promises").then((fs) => fs.readFile(manifestPath, "utf8"));
            const manifest = JSON.parse(manifestContent);
            await this.registerPlugin(manifest, source, entryPath);
          } catch {
            continue;
          }
        } else if (entry.endsWith(".plugin.js")) {
          try {
            const manifest = await this.extractManifestFromFile(entryPath);
            await this.registerPlugin(manifest, source, entryPath);
          } catch {
            continue;
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to register plugins from directory ${directory}:`, error);
    }
  }
  async registerBuiltinPlugins() {
    const builtinPlugins = [
      "eslint-adapter",
      "prettier-adapter",
      "typescript-adapter",
      "bun-test-adapter"
    ];
    for (const pluginName of builtinPlugins) {
      try {
        const manifest = await this.createBuiltinManifest(pluginName);
        const location = `./plugins/builtin/${pluginName}.js`;
        await this.registerPlugin(manifest, "builtin" /* BUILTIN */, location);
      } catch (error) {
        this.logger.warn(`Failed to register builtin plugin ${pluginName}:`, error);
      }
    }
  }
  async unregisterPlugin(name) {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }
    try {
      if (entry.instance && entry.instance.cleanup) {
        await entry.instance.cleanup();
      }
      this.plugins.delete(name);
      this.logger.info(`Plugin unregistered: ${name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister plugin ${name}:`, error);
      return false;
    }
  }
  getPlugin(name) {
    const entry = this.plugins.get(name);
    return entry?.instance;
  }
  getManifest(name) {
    const entry = this.plugins.get(name);
    return entry?.manifest;
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  getEnabledPlugins() {
    return Array.from(this.plugins.values()).filter((entry) => entry.enabled);
  }
  getPluginsByCategory(category) {
    return Array.from(this.plugins.values()).filter((entry) => entry.manifest.metadata.category === category);
  }
  getPluginsByLanguage(language) {
    return Array.from(this.plugins.values()).filter((entry) => entry.manifest.metadata.supportedLanguages.includes(language));
  }
  getPluginsByFileType(fileType) {
    return Array.from(this.plugins.values()).filter((entry) => entry.manifest.metadata.supportedFileTypes.includes(fileType));
  }
  searchPlugins(filters) {
    return Array.from(this.plugins.values()).filter((entry) => {
      const metadata = entry.manifest.metadata;
      if (filters.category && metadata.category !== filters.category) {
        return false;
      }
      if (filters.language && !metadata.supportedLanguages.includes(filters.language)) {
        return false;
      }
      if (filters.fileType && !metadata.supportedFileTypes.includes(filters.fileType)) {
        return false;
      }
      if (filters.feature) {
        const hasFeature = metadata.features[filters.feature];
        if (!hasFeature)
          return false;
      }
      if (filters.source && entry.installation.source !== filters.source) {
        return false;
      }
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchText = [
          metadata.name,
          metadata.description,
          ...metadata.keywords,
          metadata.category
        ].join(" ").toLowerCase();
        if (!searchText.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }
  setPluginEnabled(name, enabled) {
    const entry = this.plugins.get(name);
    if (!entry) {
      return false;
    }
    entry.enabled = enabled;
    this.logger.info(`Plugin ${name} ${enabled ? "enabled" : "disabled"}`);
    return true;
  }
  isPluginDisabled(name) {
    const entry = this.plugins.get(name);
    if (!entry) {
      return true;
    }
    return !entry.enabled;
  }
  recordPluginUsage(name) {
    const entry = this.plugins.get(name);
    if (entry) {
      entry.usageCount++;
      entry.lastUsed = new Date;
    }
  }
  async installPluginFromNpm(packageName) {
    this.logger.info(`Installing plugin from npm: ${packageName}`);
    try {
      const manifest = await this.createNpmManifest(packageName);
      const location = `node_modules/${packageName}`;
      await this.registerPlugin(manifest, "npm" /* NPM */, location);
      this.logger.info(`Plugin installed successfully: ${packageName}`);
    } catch (error) {
      this.logger.error(`Failed to install plugin ${packageName}:`, error);
      throw error;
    }
  }
  async installPluginFromGit(repositoryUrl) {
    this.logger.info(`Installing plugin from git: ${repositoryUrl}`);
    try {
      const manifest = await this.createGitManifest(repositoryUrl);
      const location = `./plugins/git/${Date.now()}`;
      await this.registerPlugin(manifest, "git" /* GIT */, location);
      this.logger.info(`Plugin installed successfully from git: ${repositoryUrl}`);
    } catch (error) {
      this.logger.error(`Failed to install plugin from git ${repositoryUrl}:`, error);
      throw error;
    }
  }
  getStatistics() {
    const plugins = Array.from(this.plugins.values());
    const stats = {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter((p) => p.enabled).length,
      builtinPlugins: plugins.filter((p) => p.installation.source === "builtin" /* BUILTIN */).length,
      npmPlugins: plugins.filter((p) => p.installation.source === "npm" /* NPM */).length,
      localPlugins: plugins.filter((p) => p.installation.source === "local" /* LOCAL */).length,
      gitPlugins: plugins.filter((p) => p.installation.source === "git" /* GIT */).length,
      categories: {},
      totalUsage: plugins.reduce((sum, p) => sum + p.usageCount, 0),
      mostUsedPlugins: plugins.map((p) => ({ name: p.manifest.metadata.name, usageCount: p.usageCount })).sort((a, b) => b.usageCount - a.usageCount).slice(0, 10)
    };
    for (const plugin of plugins) {
      const category = plugin.manifest.metadata.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }
    return stats;
  }
  validatePluginConfig(pluginName, config) {
    const entry = this.plugins.get(pluginName);
    if (!entry || !entry.instance) {
      return {
        valid: false,
        errors: [`Plugin ${pluginName} not found or not loaded`],
        warnings: []
      };
    }
    return entry.instance.validateConfig(config);
  }
  getPluginConfigSchema(pluginName) {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      return null;
    }
    return entry.manifest.config;
  }
  validateManifest(manifest) {
    const required = ["name", "version", "description", "author", "license", "category"];
    for (const field of required) {
      if (!(field in manifest.metadata)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    if (!/^\d+\.\d+\.\d+/.test(manifest.metadata.version)) {
      throw new Error("Invalid version format (expected x.y.z)");
    }
    const validCategories = ["linting", "formatting", "testing", "security", "performance", "coverage", "build", "other"];
    if (!validCategories.includes(manifest.metadata.category)) {
      throw new Error(`Invalid category: ${manifest.metadata.category}`);
    }
  }
  async loadPluginInstance(manifest, location) {
    try {
      const modulePath = manifest.main.startsWith("./") ? `${location}/${manifest.main.slice(2)}` : `${location}/${manifest.main}`;
      const module = await import(modulePath);
      const PluginClass = module.default || module.AnalysisPlugin;
      if (!PluginClass) {
        throw new Error(`No default export found in ${modulePath}`);
      }
      return new PluginClass;
    } catch (error) {
      throw new Error(`Failed to load plugin instance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  validatePlugin(plugin) {
    const requiredMethods = ["initialize", "execute", "getDefaultConfig", "validateConfig", "supportsIncremental", "supportsCache", "getMetrics"];
    const errors = [];
    const warnings = [];
    for (const method of requiredMethods) {
      if (typeof plugin[method] !== "function") {
        errors.push(`Missing required method: ${method}`);
      }
    }
    if (typeof plugin.name !== "string" || !plugin.name) {
      errors.push("Plugin must have a valid name");
    }
    if (typeof plugin.version !== "string" || !plugin.version) {
      errors.push("Plugin must have a valid version");
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  async extractManifestFromFile(filePath) {
    const filename = filePath.split("/").pop()?.replace(/\.(js|ts)$/, "") || "";
    return {
      metadata: {
        name: filename,
        version: "1.0.0",
        description: `Plugin extracted from ${filename}`,
        author: "Unknown",
        license: "MIT",
        keywords: [],
        category: "other",
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: [],
        engines: { node: ">=14.0.0" },
        compatibility: { platforms: ["*"], versions: ["*"] },
        features: { incremental: false, caching: false, parallel: false, streaming: false }
      },
      main: filePath
    };
  }
  async createBuiltinManifest(pluginName) {
    const manifests = {
      "eslint-adapter": {
        metadata: {
          name: "eslint-adapter",
          version: "1.0.0",
          description: "ESLint code quality adapter",
          author: "Dev Quality CLI",
          license: "MIT",
          keywords: ["eslint", "linting", "javascript", "typescript"],
          category: "linting",
          supportedLanguages: ["javascript", "typescript"],
          supportedFileTypes: [".js", ".jsx", ".ts", ".tsx"],
          dependencies: ["eslint"],
          engines: { node: ">=14.0.0" },
          compatibility: { platforms: ["*"], versions: ["*"] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        }
      },
      "prettier-adapter": {
        metadata: {
          name: "prettier-adapter",
          version: "1.0.0",
          description: "Prettier code formatting adapter",
          author: "Dev Quality CLI",
          license: "MIT",
          keywords: ["prettier", "formatting", "code-style"],
          category: "formatting",
          supportedLanguages: ["javascript", "typescript", "json", "css", "html"],
          supportedFileTypes: [".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".html"],
          dependencies: ["prettier"],
          engines: { node: ">=14.0.0" },
          compatibility: { platforms: ["*"], versions: ["*"] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        }
      },
      "typescript-adapter": {
        metadata: {
          name: "typescript-adapter",
          version: "1.0.0",
          description: "TypeScript compiler adapter",
          author: "Dev Quality CLI",
          license: "MIT",
          keywords: ["typescript", "compiler", "type-checking"],
          category: "linting",
          supportedLanguages: ["typescript"],
          supportedFileTypes: [".ts", ".tsx"],
          dependencies: ["typescript"],
          engines: { node: ">=14.0.0" },
          compatibility: { platforms: ["*"], versions: ["*"] },
          features: { incremental: true, caching: true, parallel: false, streaming: false }
        }
      },
      "bun-test-adapter": {
        metadata: {
          name: "bun-test-adapter",
          version: "1.0.0",
          description: "Bun test runner adapter",
          author: "Dev Quality CLI",
          license: "MIT",
          keywords: ["bun", "test", "testing", "coverage"],
          category: "testing",
          supportedLanguages: ["javascript", "typescript"],
          supportedFileTypes: [".test.js", ".test.ts", ".spec.js", ".spec.ts"],
          dependencies: ["bun"],
          engines: { node: ">=14.0.0" },
          compatibility: { platforms: ["*"], versions: ["*"] },
          features: { incremental: true, caching: true, parallel: true, streaming: false }
        }
      }
    };
    const baseManifest = manifests[pluginName];
    if (!baseManifest) {
      throw new Error(`Unknown builtin plugin: ${pluginName}`);
    }
    return {
      metadata: baseManifest.metadata,
      main: `${pluginName}.js`
    };
  }
  async createNpmManifest(packageName) {
    return {
      metadata: {
        name: packageName,
        version: "1.0.0",
        description: `NPM plugin: ${packageName}`,
        author: "NPM Package",
        license: "MIT",
        keywords: ["npm", "plugin"],
        category: "other",
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: [packageName],
        engines: { node: ">=14.0.0" },
        compatibility: { platforms: ["*"], versions: ["*"] },
        features: { incremental: false, caching: false, parallel: false, streaming: false }
      },
      main: "index.js"
    };
  }
  async createGitManifest(repositoryUrl) {
    const repoName = repositoryUrl.split("/").pop()?.replace(".git", "") || "unknown";
    return {
      metadata: {
        name: repoName,
        version: "1.0.0",
        description: `Git plugin: ${repoName}`,
        author: "Git Repository",
        license: "MIT",
        keywords: ["git", "plugin"],
        category: "other",
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: [],
        engines: { node: ">=14.0.0" },
        compatibility: { platforms: ["*"], versions: ["*"] },
        features: { incremental: false, caching: false, parallel: false, streaming: false }
      },
      main: "index.js"
    };
  }
}
// ../../packages/core/src/plugins/plugin-loader-v2.ts
class PluginLoaderV2 {
  registry;
  logger;
  baseLoader = null;
  loadingCache = new Map;
  defaultOptions = {
    autoUpdate: false,
    checkCompatibility: true,
    validateSignature: false,
    enableCache: true,
    timeout: 30000,
    retries: 3,
    fallbackToBuiltin: true
  };
  constructor(registry, logger) {
    this.registry = registry;
    this.logger = logger;
    this.baseLoader = null;
  }
  async init() {
    const { PluginLoader: PluginLoader2 } = await Promise.resolve().then(() => exports_plugin_loader);
    this.baseLoader = new PluginLoader2(this.logger);
  }
  async loadPlugin(identifier, options2 = {}) {
    const mergedOptions = { ...this.defaultOptions, ...options2 };
    const startTime = Date.now();
    this.logger.debug(`Loading plugin: ${identifier}`);
    if (mergedOptions.enableCache && this.loadingCache.has(identifier)) {
      const cached = this.loadingCache.get(identifier);
      this.logger.debug(`Plugin loaded from cache: ${identifier}`);
      return cached;
    }
    const result = await this.performPluginLoad(identifier, mergedOptions);
    result.loadingTime = Date.now() - startTime;
    if (mergedOptions.enableCache && result.success) {
      this.loadingCache.set(identifier, result);
    }
    return result;
  }
  async loadPlugins(identifiers, options2 = {}) {
    const results = [];
    const concurrency = Math.min(5, identifiers.length);
    const chunks = this.chunkArray(identifiers, concurrency);
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(chunk.map((id) => this.loadPlugin(id, options2)));
      for (const promiseResult of chunkResults) {
        if (promiseResult.status === "fulfilled") {
          results.push(promiseResult.value);
        } else {
          results.push({
            success: false,
            error: promiseResult.reason instanceof Error ? promiseResult.reason : new Error("Unknown error"),
            warnings: [],
            loadingTime: 0
          });
        }
      }
    }
    return results;
  }
  async loadPluginFromNpm(packageName, version2, options2 = {}) {
    const identifier = version2 ? `${packageName}@${version2}` : packageName;
    this.logger.info(`Loading plugin from npm: ${identifier}`);
    try {
      const existingEntry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === packageName);
      if (existingEntry && existingEntry.installation.source === PluginSource.NPM) {
        if (version2 && existingEntry.installation.version !== version2) {
          await this.updatePlugin(packageName, version2);
        }
        return {
          success: true,
          plugin: existingEntry.instance,
          entry: existingEntry,
          warnings: [],
          loadingTime: 0
        };
      }
      await this.registry.installPluginFromNpm(identifier);
      const entry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === packageName);
      if (!entry) {
        throw new Error(`Plugin not found after installation: ${packageName}`);
      }
      return {
        success: true,
        plugin: entry.instance,
        entry,
        warnings: [],
        loadingTime: 0
      };
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error("Unknown error");
      if (options2.fallbackToBuiltin) {
        return this.tryBuiltinFallback(packageName, loadError, options2);
      }
      return {
        success: false,
        error: loadError,
        warnings: [],
        loadingTime: 0
      };
    }
  }
  async loadPluginFromGit(repositoryUrl, branch, options2 = {}) {
    const identifier = branch ? `${repositoryUrl}#${branch}` : repositoryUrl;
    this.logger.info(`Loading plugin from git: ${identifier}`);
    try {
      await this.registry.installPluginFromGit(identifier);
      const repoName = repositoryUrl.split("/").pop()?.replace(".git", "") || "unknown";
      const entry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === repoName);
      if (!entry) {
        throw new Error(`Plugin not found after installation: ${repoName}`);
      }
      return {
        success: true,
        plugin: entry.instance,
        entry,
        warnings: [],
        loadingTime: 0
      };
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error("Unknown error");
      return {
        success: false,
        error: loadError,
        warnings: [],
        loadingTime: 0
      };
    }
  }
  async loadPluginFromPath(pluginPath, options2 = {}) {
    this.logger.info(`Loading plugin from path: ${pluginPath}`);
    try {
      if (!this.baseLoader) {
        await this.init();
      }
      const plugin = await this.baseLoader.loadPlugin(pluginPath);
      const manifest = await this.createLocalManifest(pluginPath, plugin);
      await this.registry.registerPlugin(manifest, PluginSource.LOCAL, pluginPath);
      const entry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === manifest.metadata.name);
      return {
        success: true,
        plugin,
        entry,
        warnings: [],
        loadingTime: 0
      };
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error("Unknown error");
      return {
        success: false,
        error: loadError,
        warnings: [],
        loadingTime: 0
      };
    }
  }
  async discoverAndLoadPlugins(searchPaths, options2 = {}) {
    const results = [];
    for (const searchPath of searchPaths) {
      this.logger.debug(`Discovering plugins in: ${searchPath}`);
      try {
        await this.registry.registerPluginsFromDirectory(searchPath, PluginSource.LOCAL);
        const discoveredPlugins = this.registry.getAllPlugins().filter((p) => p.installation.source === PluginSource.LOCAL && p.installation.location.startsWith(searchPath));
        for (const entry of discoveredPlugins) {
          results.push({
            success: true,
            plugin: entry.instance,
            entry,
            warnings: [],
            loadingTime: 0
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to discover plugins in ${searchPath}:`, error);
      }
    }
    return results;
  }
  async unloadPlugin(pluginName) {
    this.logger.info(`Unloading plugin: ${pluginName}`);
    this.loadingCache.delete(pluginName);
    return await this.registry.unregisterPlugin(pluginName);
  }
  async updatePlugin(pluginName, version2) {
    this.logger.info(`Updating plugin: ${pluginName}`);
    const entry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === pluginName);
    if (!entry) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }
    switch (entry.installation.source) {
      case PluginSource.NPM:
        const identifier = version2 ? `${pluginName}@${version2}` : pluginName;
        await this.registry.installPluginFromNpm(identifier);
        break;
      case PluginSource.GIT:
        await this.registry.installPluginFromGit(entry.installation.location);
        break;
      case PluginSource.LOCAL:
        this.logger.warn(`Cannot update local plugin: ${pluginName}`);
        break;
      case PluginSource.BUILTIN:
        this.logger.warn(`Cannot update builtin plugin: ${pluginName}`);
        break;
    }
  }
  getLoadingStatistics() {
    const cacheEntries = Array.from(this.loadingCache.values());
    const totalLoadTime = cacheEntries.reduce((sum, entry) => sum + entry.loadingTime, 0);
    const averageLoadTime = cacheEntries.length > 0 ? totalLoadTime / cacheEntries.length : 0;
    const pluginsBySource = {
      [PluginSource.BUILTIN]: 0,
      [PluginSource.NPM]: 0,
      [PluginSource.LOCAL]: 0,
      [PluginSource.GIT]: 0
    };
    for (const entry of this.registry.getAllPlugins()) {
      pluginsBySource[entry.installation.source]++;
    }
    return {
      cacheSize: this.loadingCache.size,
      cacheHitRate: 0,
      totalLoadTime,
      averageLoadTime,
      pluginsBySource,
      recentLoads: []
    };
  }
  clearCache() {
    this.loadingCache.clear();
    this.logger.debug("Plugin loading cache cleared");
  }
  async performPluginLoad(identifier, options2) {
    const warnings = [];
    try {
      const existingEntry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === identifier);
      if (existingEntry && existingEntry.instance) {
        return {
          success: true,
          plugin: existingEntry.instance,
          entry: existingEntry,
          warnings,
          loadingTime: 0
        };
      }
      if (identifier.startsWith("git+")) {
        return await this.loadPluginFromGit(identifier.slice(4), undefined, options2);
      } else if (identifier.includes("@") && !identifier.startsWith(".")) {
        return await this.loadPluginFromNpm(identifier, undefined, options2);
      } else if (identifier.includes("/") || identifier.startsWith(".")) {
        return await this.loadPluginFromPath(identifier, options2);
      } else {
        try {
          return await this.loadPluginFromNpm(identifier, undefined, options2);
        } catch (npmError) {
          if (options2.fallbackToBuiltin) {
            return this.tryBuiltinFallback(identifier, npmError instanceof Error ? npmError : new Error("Unknown error"), options2);
          }
          throw npmError;
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
        warnings,
        loadingTime: 0
      };
    }
  }
  async tryBuiltinFallback(identifier, originalError, options2) {
    this.logger.warn(`Failed to load ${identifier}, trying builtin fallback:`, originalError);
    const builtinName = this.getBuiltinEquivalent(identifier);
    if (!builtinName) {
      return {
        success: false,
        error: originalError,
        warnings: [`No builtin equivalent found for ${identifier}`],
        loadingTime: 0
      };
    }
    try {
      const entry = this.registry.getAllPlugins().find((p) => p.manifest.metadata.name === builtinName);
      if (!entry) {
        throw new Error(`Builtin plugin not found: ${builtinName}`);
      }
      return {
        success: true,
        plugin: entry.instance,
        entry,
        warnings: [`Using builtin fallback: ${builtinName} instead of ${identifier}`],
        loadingTime: 0
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: originalError,
        warnings: [
          `Failed to load ${identifier}`,
          `Builtin fallback ${builtinName} also failed: ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`
        ],
        loadingTime: 0
      };
    }
  }
  getBuiltinEquivalent(identifier) {
    const equivalents = {
      eslint: "eslint-adapter",
      "@typescript-eslint/cli": "typescript-adapter",
      prettier: "prettier-adapter",
      typescript: "typescript-adapter",
      bun: "bun-test-adapter"
    };
    const baseName = identifier.split("@")[0].split("/")[0];
    return equivalents[baseName] || null;
  }
  async createLocalManifest(pluginPath, plugin) {
    const path = await import("path");
    const filename = path.basename(pluginPath, path.extname(pluginPath));
    return {
      metadata: {
        name: plugin.name || filename,
        version: plugin.version || "1.0.0",
        description: `Local plugin: ${filename}`,
        author: "Local Developer",
        license: "MIT",
        keywords: [],
        category: "other",
        supportedLanguages: [],
        supportedFileTypes: [],
        dependencies: plugin.dependencies || [],
        engines: { node: ">=14.0.0" },
        compatibility: { platforms: ["*"], versions: ["*"] },
        features: {
          incremental: plugin.supportsIncremental(),
          caching: plugin.supportsCache(),
          parallel: false,
          streaming: false
        }
      },
      main: path.basename(pluginPath)
    };
  }
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0;i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
// ../../packages/core/src/analysis/analysis-engine.ts
import { EventEmitter } from "events";
class AnalysisEngine extends EventEmitter {
  config;
  pluginManager;
  sandbox;
  dependencyResolver;
  activeAnalyses = new Map;
  logger;
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.pluginManager = new PluginManager(logger);
    this.sandbox = new PluginSandbox(config.sandboxConfig, logger);
    this.dependencyResolver = new PluginDependencyResolver(logger);
  }
  async initialize() {
    this.logger.info("Initializing Analysis Engine");
    try {
      this.logger.info("Analysis Engine initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize Analysis Engine:", error);
      throw error;
    }
  }
  async executeAnalysis(projectId, context, options2 = {}) {
    const startTime = Date.now();
    const abortController = new AbortController;
    context.signal = abortController.signal;
    this.activeAnalyses.set(projectId, {
      startTime: new Date,
      abortController
    });
    try {
      this.emit("analysis:start", projectId);
      this.logger.info(`Starting analysis for project: ${projectId}`);
      const plugins = this.getPluginsForAnalysis(options2.plugins);
      if (plugins.length === 0) {
        throw new Error("No plugins available for analysis");
      }
      const progress = {
        totalPlugins: plugins.length,
        completedPlugins: 0,
        percentage: 0,
        startTime: new Date
      };
      const results = await this.executePluginsWithDependencies(plugins, context, progress, projectId, options2.incremental || false);
      await this.aggregateResults(results, projectId);
      const analysisResult = {
        id: this.generateAnalysisId(),
        projectId,
        timestamp: new Date,
        duration: Date.now() - startTime,
        overallScore: this.calculateOverallScore(results),
        toolResults: results,
        summary: this.createResultSummary(results),
        aiPrompts: this.generateAIPrompts(results)
      };
      this.emit("analysis:complete", projectId, analysisResult);
      this.logger.info(`Analysis completed for project: ${projectId} in ${analysisResult.duration}ms`);
      return analysisResult;
    } catch (error) {
      const analysisError = error instanceof Error ? error : new Error("Unknown analysis error");
      this.emit("analysis:error", projectId, analysisError);
      this.logger.error(`Analysis failed for project: ${projectId}`, analysisError);
      throw analysisError;
    } finally {
      this.activeAnalyses.delete(projectId);
    }
  }
  async executePluginAnalysis(projectId, pluginNames, context) {
    return this.executeAnalysis(projectId, context, { plugins: pluginNames });
  }
  async cancelAnalysis(projectId) {
    const activeAnalysis = this.activeAnalyses.get(projectId);
    if (!activeAnalysis) {
      throw new Error(`No active analysis found for project: ${projectId}`);
    }
    activeAnalysis.abortController.abort();
    await this.sandbox.stopAllPlugins();
    this.activeAnalyses.delete(projectId);
    this.logger.info(`Analysis cancelled for project: ${projectId}`);
  }
  getActiveAnalyses() {
    return Array.from(this.activeAnalyses.keys());
  }
  getAnalysisStatus(projectId) {
    const activeAnalysis = this.activeAnalyses.get(projectId);
    if (!activeAnalysis) {
      return { active: false };
    }
    return {
      active: true,
      startTime: activeAnalysis.startTime,
      duration: Date.now() - activeAnalysis.startTime.getTime()
    };
  }
  async registerPlugins(plugins) {
    for (const plugin of plugins) {
      await this.registerPlugin(plugin);
    }
  }
  async registerPlugin(plugin) {
    try {
      this.dependencyResolver.addPlugin(plugin);
      await this.pluginManager.registerPlugin(plugin);
      this.logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`);
    } catch (error) {
      this.logger.error(`Failed to register plugin: ${plugin.name}`, error);
      throw error;
    }
  }
  getPlugins() {
    return this.pluginManager.getAllPlugins();
  }
  getPlugin(name) {
    return this.pluginManager.getPlugin(name);
  }
  getMetrics() {
    return {
      registeredPlugins: this.pluginManager.getPluginCount(),
      activeAnalyses: this.activeAnalyses.size,
      pluginMetrics: this.pluginManager.getAllPluginMetrics(),
      dependencyStats: this.dependencyResolver.getStatistics()
    };
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.sandboxConfig) {
      this.sandbox.updateConfig(newConfig.sandboxConfig);
    }
    this.logger.info("Analysis Engine configuration updated");
  }
  async cleanup() {
    this.logger.info("Cleaning up Analysis Engine");
    const activeAnalyses = Array.from(this.activeAnalyses.keys());
    for (const projectId of activeAnalyses) {
      try {
        await this.cancelAnalysis(projectId);
      } catch (error) {
        this.logger.warn(`Failed to cancel analysis for ${projectId}:`, error);
      }
    }
    await this.pluginManager.cleanup();
    await this.sandbox.stopAllPlugins();
    this.removeAllListeners();
    this.logger.info("Analysis Engine cleaned up");
  }
  getPluginsForAnalysis(pluginNames) {
    if (pluginNames && pluginNames.length > 0) {
      const plugins = pluginNames.map((name) => this.pluginManager.getPlugin(name)).filter((plugin) => plugin !== undefined);
      if (plugins.length !== pluginNames.length) {
        const missing = pluginNames.filter((name) => !this.pluginManager.hasPlugin(name));
        throw new Error(`Plugins not found: ${missing.join(", ")}`);
      }
      return plugins;
    }
    return this.pluginManager.getAllPlugins();
  }
  async executePluginsWithDependencies(plugins, context, progress, projectId, incremental) {
    const validation = this.dependencyResolver.validateDependencies();
    if (!validation.valid) {
      throw new Error(`Dependency validation failed: ${validation.errors.join(", ")}`);
    }
    const parallelGroups = this.dependencyResolver.getParallelGroups();
    const results = [];
    for (const group of parallelGroups) {
      const groupPlugins = group.map((name) => plugins.find((p) => p.name === name)).filter((plugin) => plugin !== undefined);
      if (groupPlugins.length === 0)
        continue;
      const groupPromises = groupPlugins.map((plugin) => this.executeSinglePlugin(plugin, context, progress, projectId, incremental));
      try {
        const groupResults = await Promise.allSettled(groupPromises);
        for (const result of groupResults) {
          if (result.status === "fulfilled") {
            results.push(result.value);
          } else {
            this.logger.error("Plugin execution failed:", result.reason);
            const errorResult = this.createErrorResult(result.reason);
            results.push(errorResult);
          }
        }
      } catch (error) {
        this.logger.error("Plugin group execution failed:", error);
        throw error;
      }
    }
    return results;
  }
  async executeSinglePlugin(plugin, context, progress, projectId, incremental) {
    const pluginName = plugin.name;
    try {
      this.emit("analysis:plugin-start", projectId, pluginName);
      progress.currentPlugin = pluginName;
      progress.completedPlugins++;
      progress.percentage = Math.round(progress.completedPlugins / progress.totalPlugins * 100);
      this.emit("analysis:progress", projectId, progress);
      if (incremental && plugin.supportsIncremental() && context.changedFiles) {
        const relevantFiles = context.changedFiles.filter((file) => this.isPluginRelevantForFile(plugin, file));
        if (relevantFiles.length === 0) {
          const emptyResult = await plugin.execute(context);
          this.emit("analysis:plugin-complete", projectId, pluginName, emptyResult);
          return emptyResult;
        }
      }
      const result = await this.sandbox.executePlugin(plugin, context, this.config.defaultTimeout);
      this.emit("analysis:plugin-complete", projectId, pluginName, result);
      this.logger.debug(`Plugin ${pluginName} completed successfully`);
      return result;
    } catch (error) {
      const pluginError = error instanceof Error ? error : new Error("Unknown plugin error");
      this.emit("analysis:plugin-error", projectId, pluginName, pluginError);
      this.logger.error(`Plugin ${pluginName} failed:`, pluginError);
      return this.createErrorResult(pluginError, pluginName);
    }
  }
  isPluginRelevantForFile(plugin, filePath) {
    const extension = filePath.split(".").pop()?.toLowerCase();
    switch (plugin.name) {
      case "eslint":
        return ["js", "jsx", "ts", "tsx"].includes(extension || "");
      case "prettier":
        return ["js", "jsx", "ts", "tsx", "json", "md", "css", "scss", "html"].includes(extension || "");
      case "typescript":
        return ["ts", "tsx"].includes(extension || "");
      case "bun-test":
        return filePath.includes(".test.") || filePath.includes(".spec.");
      default:
        return true;
    }
  }
  createErrorResult(error, pluginName = "unknown") {
    return {
      toolName: pluginName,
      executionTime: 0,
      status: "error",
      issues: [{
        id: `plugin-error-${Date.now()}`,
        type: "error",
        toolName: pluginName,
        filePath: "",
        lineNumber: 0,
        message: error.message,
        fixable: false,
        score: 100
      }],
      metrics: {
        issuesCount: 1,
        errorsCount: 1,
        warningsCount: 0,
        infoCount: 0,
        fixableCount: 0,
        score: 0
      }
    };
  }
  async aggregateResults(results, _projectId) {
    return {
      totalIssues: results.reduce((sum, result) => sum + result.issues.length, 0),
      totalErrors: results.reduce((sum, result) => sum + result.metrics.errorsCount, 0),
      totalWarnings: results.reduce((sum, result) => sum + result.metrics.warningsCount, 0),
      executionOrder: results.map((result) => result.toolName)
    };
  }
  calculateOverallScore(results) {
    if (results.length === 0)
      return 100;
    const totalScore = results.reduce((sum, result) => sum + result.metrics.score, 0);
    return Math.round(totalScore / results.length);
  }
  createResultSummary(results) {
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    const totalErrors = results.reduce((sum, result) => sum + result.metrics.errorsCount, 0);
    const totalWarnings = results.reduce((sum, result) => sum + result.metrics.warningsCount, 0);
    const totalFixable = results.reduce((sum, result) => sum + result.metrics.fixableCount, 0);
    return {
      totalIssues,
      totalErrors,
      totalWarnings,
      totalFixable,
      overallScore: this.calculateOverallScore(results),
      toolCount: results.length,
      executionTime: results.reduce((sum, result) => sum + result.executionTime, 0)
    };
  }
  generateAIPrompts(results) {
    const prompts = [];
    const criticalIssues = results.flatMap((result) => result.issues).filter((issue) => issue.type === "error" && issue.score >= 80).slice(0, 5);
    if (criticalIssues.length > 0) {
      prompts.push({
        id: `critical-issues-${Date.now()}`,
        type: "fix-suggestions",
        title: "Critical Issues Fix Suggestions",
        description: `Provide fix suggestions for ${criticalIssues.length} critical issues`,
        issues: criticalIssues,
        priority: "high"
      });
    }
    return prompts;
  }
  generateAnalysisId() {
    return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
// ../../packages/core/src/analysis/task-scheduler.ts
import { EventEmitter as EventEmitter2 } from "events";
class TaskScheduler extends EventEmitter2 {
  config;
  logger;
  taskQueue = [];
  runningTasks = new Map;
  completedTasks = new Map;
  failedTasks = new Map;
  workers = new Map;
  taskCounter = 0;
  isRunning = false;
  processingInterval = null;
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
  }
  start() {
    if (this.isRunning) {
      this.logger.warn("Task scheduler is already running");
      return;
    }
    this.isRunning = true;
    this.initializeWorkers();
    this.startProcessing();
    this.logger.info(`Task scheduler started with ${this.workers.size} workers`);
  }
  async stop() {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    const timeout = this.config.workerTimeout;
    const startTime = Date.now();
    while (this.runningTasks.size > 0 && Date.now() - startTime < timeout) {
      await this.sleep(100);
    }
    for (const task of this.runningTasks.values()) {
      this.cancelTask(task.id);
    }
    this.logger.info("Task scheduler stopped");
  }
  scheduleTask(nameOrPlugin, contextOrFunction, options2 = {}) {
    if (typeof nameOrPlugin === "string" && typeof contextOrFunction === "function") {
      const taskId2 = nameOrPlugin;
      const taskFn = contextOrFunction;
      const mockPlugin = {
        name: taskId2,
        version: "1.0.0",
        description: `Mock plugin for ${taskId2}`,
        execute: async (context) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          const result = await taskFn();
          if (result && typeof result === "object") {
            return {
              toolName: taskId2,
              executionTime: 100,
              status: result.success !== false ? "success" : "error",
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: result.success === false ? 1 : 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: result.success === false ? 0 : 100
              },
              ...result
            };
          }
          return {
            toolName: taskId2,
            executionTime: 100,
            status: "success",
            issues: [],
            metrics: {
              issuesCount: 0,
              errorsCount: 0,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 100
            }
          };
        },
        supportsIncremental: () => false,
        supportsCache: () => false,
        getMetrics: () => ({}),
        validateConfig: () => ({ valid: true, errors: [], warnings: [] }),
        getDefaultConfig: () => ({}),
        cleanup: () => Promise.resolve()
      };
      const mockContext = {
        projectId: "test-project",
        projectPath: "/test",
        options: {},
        startTime: Date.now(),
        signal: undefined
      };
      const task2 = {
        id: taskId2,
        name: taskId2,
        priority: typeof options2.priority === "number" ? options2.priority <= 3 ? "low" : options2.priority <= 7 ? "normal" : options2.priority <= 12 ? "high" : "critical" : options2.priority || "normal",
        dependencies: options2.dependencies?.map((dep) => {
          if (typeof dep === "string")
            return { taskId: dep, type: "completion" };
          if (dep && typeof dep === "object" && dep.taskId)
            return dep;
          return { taskId: String(dep), type: "completion" };
        }) || [],
        timeout: options2.timeout || 5000,
        status: "pending",
        createdAt: new Date
      };
      const actualTask = {
        id: taskId2,
        plugin: mockPlugin,
        context: mockContext,
        priority: typeof options2.priority === "string" ? this.convertPriority(options2.priority) : options2.priority || 0,
        dependencies: options2.dependencies?.map((dep) => {
          if (typeof dep === "string")
            return dep;
          if (dep && typeof dep === "object" && dep.taskId)
            return dep.taskId;
          return String(dep);
        }) || [],
        timeout: options2.timeout || this.config.workerTimeout,
        retryCount: 0,
        maxRetries: (options2.retryAttempts ? Math.max(0, options2.retryAttempts - 1) : undefined) ?? options2.maxRetries ?? this.config.maxRetries,
        createdAt: new Date,
        scheduledAt: options2.scheduledAt,
        startedAt: undefined,
        completedAt: undefined
      };
      if (this.taskQueue.length >= this.config.maxQueueSize) {
        this.emit("queue:full", task2);
        throw new Error("Task queue is full");
      }
      this.taskCounter++;
      this.insertTaskByPriority(actualTask);
      this.emit("task:scheduled", task2);
      this.logger.debug(`Task scheduled: ${taskId2}`);
      return task2;
    }
    const taskId = this.generateTaskId();
    const task = {
      id: taskId,
      plugin: nameOrPlugin,
      context: contextOrFunction,
      priority: typeof options2.priority === "number" ? options2.priority : 0,
      dependencies: options2.dependencies || [],
      timeout: options2.timeout || this.config.workerTimeout,
      retryCount: 0,
      maxRetries: (options2.retryAttempts ? options2.retryAttempts - 1 : undefined) ?? options2.maxRetries ?? this.config.maxRetries ?? 0,
      createdAt: new Date,
      scheduledAt: options2.scheduledAt,
      startedAt: undefined,
      completedAt: undefined
    };
    if (this.taskQueue.length >= this.config.maxQueueSize) {
      this.emit("queue:full", task);
      throw new Error("Task queue is full");
    }
    this.taskCounter++;
    this.insertTaskByPriority(task);
    this.emit("task:scheduled", task);
    this.logger.debug(`Task scheduled: ${taskId} for plugin: ${nameOrPlugin.name}`);
    return taskId;
  }
  convertPriority(priority) {
    const priorityMap = {
      low: 1,
      normal: 5,
      high: 10,
      critical: 15
    };
    return priorityMap[priority] || 5;
  }
  scheduleTasks(tasks) {
    const taskIds = [];
    for (const task of tasks) {
      try {
        const taskId = this.scheduleTask(task.plugin, task.context, task.options);
        taskIds.push(taskId);
      } catch (error) {
        this.logger.error(`Failed to schedule task for plugin ${task.plugin.name}:`, error);
      }
    }
    return taskIds;
  }
  cancelTask(taskId) {
    if (this.completedTasks.has(taskId)) {
      const result = this.completedTasks.get(taskId);
      if (result.status === "completed" /* COMPLETED */ || result.status === "failed" /* FAILED */) {
        return false;
      }
    }
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.status = "cancelled" /* CANCELLED */;
      this.completedTasks.set(taskId, {
        task,
        status: "cancelled" /* CANCELLED */,
        executionTime: 0,
        retryAttempt: 0,
        retryCount: 0,
        completedAt: new Date
      });
      return true;
    }
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.completedAt = new Date;
      if (runningTask.context.signal) {}
      this.runningTasks.delete(taskId);
      const cancelledResult = {
        task: runningTask,
        status: "cancelled" /* CANCELLED */,
        executionTime: 0,
        retryAttempt: 0
      };
      this.completedTasks.set(taskId, cancelledResult);
      this.freeWorker(this.getWorkerForTask(taskId));
      return true;
    }
    return false;
  }
  getTaskStatus(taskId) {
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask)
      return "running" /* RUNNING */;
    const completedTask = this.completedTasks.get(taskId);
    if (completedTask)
      return completedTask.status;
    const queuedTask = this.taskQueue.find((task) => task.id === taskId);
    if (queuedTask)
      return "pending" /* PENDING */;
    return null;
  }
  getTask(taskId) {
    if (this.runningTasks.has(taskId)) {
      return this.runningTasks.get(taskId);
    }
    if (this.completedTasks.has(taskId)) {
      return this.completedTasks.get(taskId).task;
    }
    if (this.failedTasks.has(taskId)) {
      return this.failedTasks.get(taskId).task;
    }
    this.logger.debug(`Searching in task queue with ${this.taskQueue.length} items for task ${taskId}`);
    const queuedTask = this.taskQueue.find((task) => task.id === taskId);
    this.logger.debug(`Found queued task: ${!!queuedTask}`);
    if (queuedTask) {
      return queuedTask;
    }
    const runningTaskByName = Array.from(this.runningTasks.values()).find((task) => task.plugin.name === taskId);
    if (runningTaskByName) {
      return runningTaskByName;
    }
    const queuedTaskByName = this.taskQueue.find((task) => task.plugin.name === taskId);
    if (queuedTaskByName) {
      return queuedTaskByName;
    }
    return null;
  }
  getTaskResult(taskId) {
    return this.completedTasks.get(taskId) || this.failedTasks.get(taskId) || null;
  }
  getStatistics() {
    const completed = Array.from(this.completedTasks.values());
    const failed = completed.filter((result) => result.status === "failed" /* FAILED */).length;
    const cancelled = completed.filter((result) => result.status === "cancelled" /* CANCELLED */).length;
    const avgExecutionTime = completed.length > 0 ? completed.reduce((sum, result) => sum + result.executionTime, 0) / completed.length : 0;
    const workerUtilization = this.workers.size > 0 ? Array.from(this.workers.values()).filter((w) => w.busy).length / this.workers.size : 0;
    const queueUtilization = this.taskQueue.length / this.config.maxQueueSize;
    return {
      totalTasks: this.taskCounter,
      pendingTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: completed.length,
      failedTasks: failed,
      cancelledTasks: cancelled,
      averageExecutionTime: avgExecutionTime,
      workerUtilization,
      queueUtilization
    };
  }
  async executeTask(taskId) {
    this.logger.debug(`executeTask called with taskId: ${taskId}`);
    this.logger.debug(`Looking for task ${taskId}`);
    const task = this.getTask(taskId);
    this.logger.debug(`Found task: ${!!task}`);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    const existingResult = this.getTaskResult(taskId);
    if (existingResult) {
      return existingResult;
    }
    const completedTaskNames = Array.from(this.completedTasks.values()).filter((result) => result.status === "completed" /* COMPLETED */).map((result) => result.task.plugin.name);
    const runningTaskNames = Array.from(this.runningTasks.values()).map((task2) => task2.plugin.name);
    if (this.hasCircularDependency(task, completedTaskNames, runningTaskNames)) {
      throw new Error(`circular dependency detected for task: ${task.id}`);
    }
    for (const dep of task.dependencies) {
      const depTask = this.getTask(dep);
      if (!depTask) {
        const errorMsg = `Dependency task '${dep}' not found - dependency not found`;
        const taskResult = {
          task,
          status: "failed" /* FAILED */,
          error: errorMsg,
          executionTime: 0,
          retryAttempt: task.retryCount,
          retryCount: 0,
          completedAt: new Date
        };
        this.failedTasks.set(taskId, taskResult);
        return taskResult;
      }
    }
    this.logger.debug(`Task execution check: plugin exists=${!!task.plugin}, plugin.name=${task.plugin?.name}, taskId=${taskId}, match=${task.plugin?.name === taskId}`);
    if (task.plugin && task.plugin.name === taskId) {
      this.logger.debug(`Executing task ${taskId} directly (maxRetries: ${task.maxRetries})`);
      let lastError = null;
      let retryCount = 0;
      while (retryCount <= task.maxRetries) {
        try {
          const startedAt = new Date;
          task.startedAt = startedAt;
          if (retryCount === 0) {
            this.emit("task:started", task);
          } else {
            this.emit("task:retry", task, retryCount);
          }
          let result;
          try {
            result = await this.executeTaskWithTimeout(task);
          } catch (error) {
            if (error instanceof Error && error.message.includes("timeout")) {
              task.completedAt = new Date;
              const timeoutResult = {
                task,
                status: "failed" /* FAILED */,
                error: "Task execution timeout",
                result: {
                  toolName: taskId,
                  executionTime: task.timeout,
                  status: "error",
                  issues: [],
                  metrics: {
                    issuesCount: 0,
                    errorsCount: 1,
                    warningsCount: 0,
                    infoCount: 0,
                    fixableCount: 0,
                    score: 0
                  }
                },
                executionTime: task.timeout,
                retryAttempt: task.retryCount,
                retryCount
              };
              this.failedTasks.set(taskId, timeoutResult);
              this.emit("task:failed", timeoutResult);
              return timeoutResult;
            }
            throw error;
          }
          const completedAt = new Date;
          task.completedAt = completedAt;
          const realExecutionTime = completedAt.getTime() - startedAt.getTime();
          const taskResult = {
            task,
            status: result.status === "error" ? "failed" /* FAILED */ : "completed" /* COMPLETED */,
            result,
            executionTime: realExecutionTime,
            retryAttempt: task.retryCount,
            retryCount: Math.max(0, retryCount),
            completedAt: task.completedAt
          };
          if (taskResult.status === "completed" /* COMPLETED */) {
            this.completedTasks.set(taskId, taskResult);
            this.emit("task:completed", taskResult);
            return taskResult;
          } else {
            if (retryCount < task.maxRetries) {
              throw new Error("Plugin returned error status");
            }
            this.failedTasks.set(taskId, taskResult);
            this.emit("task:failed", taskResult);
            return taskResult;
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          retryCount++;
          if (retryCount <= task.maxRetries) {
            await this.sleep(this.calculateRetryDelay(retryCount));
            continue;
          }
          const completedAt = new Date;
          task.completedAt = completedAt;
          const executionTime = completedAt.getTime() - (task.startedAt?.getTime() || 0);
          const taskResult = {
            task,
            status: "failed" /* FAILED */,
            error: lastError instanceof Error ? `Error: ${lastError.message}` : `Error: ${String(lastError)}`,
            result: {
              toolName: taskId,
              executionTime,
              status: "error",
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: 1,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 0
              }
            },
            executionTime,
            retryAttempt: task.retryCount,
            retryCount,
            completedAt: task.completedAt
          };
          this.failedTasks.set(taskId, taskResult);
          this.emit("task:failed", taskResult);
          return taskResult;
        }
      }
      if (lastError) {
        const completedAt = new Date;
        task.completedAt = completedAt;
        const executionTime = completedAt.getTime() - (task.startedAt?.getTime() || 0);
        const taskResult = {
          task,
          status: "failed" /* FAILED */,
          error: lastError instanceof Error ? `Error: ${lastError.message}` : `Error: ${String(lastError)}`,
          result: {
            toolName: taskId,
            executionTime,
            status: "error",
            issues: [],
            metrics: {
              issuesCount: 0,
              errorsCount: 1,
              warningsCount: 0,
              infoCount: 0,
              fixableCount: 0,
              score: 0
            }
          },
          executionTime,
          retryAttempt: task.retryCount,
          retryCount,
          completedAt: task.completedAt
        };
        this.failedTasks.set(taskId, taskResult);
        this.emit("task:failed", taskResult);
        return taskResult;
      }
      throw new Error(`Task ${taskId} completed without result`);
    }
    if (!this.isRunning) {
      this.start();
    }
    const results = await this.waitForCompletion([taskId]);
    if (results.length === 0) {
      throw new Error(`Task ${taskId} did not return a result`);
    }
    return results[0];
  }
  async waitForCompletion(taskIds) {
    const targetTasks = taskIds || [];
    const results = [];
    for (const taskId of targetTasks) {
      let result = this.getTaskResult(taskId);
      let attempts = 0;
      const maxAttempts = 100;
      while (!result && attempts < maxAttempts) {
        await this.sleep(100);
        result = this.getTaskResult(taskId);
        attempts++;
      }
      if (!result) {
        throw new Error(`Task ${taskId} did not complete within timeout`);
      }
      results.push(result);
    }
    return results;
  }
  initializeWorkers() {
    for (let i = 0;i < this.config.maxWorkers; i++) {
      const workerId = `worker-${i}`;
      this.workers.set(workerId, { busy: false });
    }
  }
  startProcessing() {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 10);
  }
  async processQueue() {
    if (!this.isRunning)
      return;
    const availableWorkers = Array.from(this.workers.entries()).filter(([, worker]) => !worker.busy).map(([id]) => id);
    if (availableWorkers.length === 0)
      return;
    const executableTasks = this.findExecutableTasks();
    if (executableTasks.length === 0)
      return;
    const tasksToExecute = executableTasks.slice(0, availableWorkers.length);
    for (let i = 0;i < tasksToExecute.length; i++) {
      const task = tasksToExecute[i];
      const workerId = availableWorkers[i];
      if (!task) {
        this.logger.warn(`Task at index ${i} is undefined, skipping`);
        continue;
      }
      await this.executeTaskInWorker(task, workerId);
    }
  }
  findExecutableTasks() {
    const runningTaskNames = Array.from(this.runningTasks.values()).map((task) => task.plugin.name);
    const completedTaskNames = Array.from(this.completedTasks.values()).filter((result) => result.status === "completed" /* COMPLETED */).map((result) => result.task.plugin.name);
    for (const task of this.taskQueue) {
      if (this.hasCircularDependency(task, completedTaskNames, runningTaskNames)) {
        throw new Error(`Circular dependency detected for task: ${task.id}`);
      }
    }
    return this.taskQueue.filter((task) => task.dependencies.every((dep) => completedTaskNames.includes(dep) && !runningTaskNames.includes(dep)));
  }
  hasCircularDependency(task, completedTasks, runningTasks) {
    const visited = new Set;
    const recursionStack = new Set;
    const hasCycle = (taskId) => {
      if (recursionStack.has(taskId)) {
        return true;
      }
      if (visited.has(taskId) || completedTasks.includes(taskId)) {
        return false;
      }
      visited.add(taskId);
      recursionStack.add(taskId);
      const currentTask = this.taskQueue.find((t) => t.id === taskId || t.plugin.name === taskId);
      if (currentTask) {
        for (const dep of currentTask.dependencies) {
          if (hasCycle(dep)) {
            return true;
          }
        }
      }
      recursionStack.delete(taskId);
      return false;
    };
    return hasCycle(task.id);
  }
  async executeTaskInWorker(task, workerId) {
    const queueIndex = this.taskQueue.findIndex((t) => t.id === task.id);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
    }
    const worker = this.workers.get(workerId);
    if (!worker)
      return;
    worker.busy = true;
    worker.currentTask = task;
    this.emit("worker:busy", workerId);
    this.runningTasks.set(task.id, task);
    task.startedAt = new Date;
    this.emit("task:started", task);
    try {
      const result = await this.executeTaskWithTimeout(task);
      await this.handleTaskResult(task, result);
    } catch (error) {
      await this.handleTaskError(task, error instanceof Error ? error : new Error("Unknown error"));
    } finally {
      this.runningTasks.delete(task.id);
      worker.busy = false;
      worker.currentTask = undefined;
      this.emit("worker:available", workerId);
    }
  }
  async executeTaskWithTimeout(task) {
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task timeout after ${task.timeout}ms`));
      }, task.timeout);
    });
    const executionPromise = this.executePlugin(task.plugin, task.context);
    return Promise.race([executionPromise, timeoutPromise]);
  }
  async executePlugin(plugin, context) {
    return plugin.execute(context);
  }
  async handleTaskResult(task, result) {
    task.completedAt = new Date;
    const executionTime = task.completedAt.getTime() - (task.startedAt?.getTime() || 0);
    const taskResult = {
      task,
      status: "completed" /* COMPLETED */,
      result,
      executionTime,
      retryAttempt: task.retryCount,
      completedAt: task.completedAt || new Date
    };
    this.completedTasks.set(task.id, taskResult);
    this.emit("task:completed", taskResult);
    this.logger.debug(`Task completed: ${task.id} in ${executionTime}ms`);
  }
  async handleTaskError(task, error) {
    task.completedAt = new Date;
    const executionTime = task.completedAt.getTime() - (task.startedAt?.getTime() || 0);
    if (this.config.enableRetry && task.retryCount < task.maxRetries) {
      task.retryCount++;
      task.scheduledAt = new Date(Date.now() + this.calculateRetryDelay(task.retryCount));
      this.insertTaskByPriority(task);
      this.emit("task:retry", task, task.retryCount);
      this.logger.warn(`Task ${task.id} failed, retrying (${task.retryCount}/${task.maxRetries}): ${error.message}`);
      return;
    }
    const taskResult = {
      task,
      status: "failed" /* FAILED */,
      error,
      executionTime,
      retryAttempt: task.retryCount,
      completedAt: task.completedAt || new Date
    };
    this.failedTasks.set(task.id, taskResult);
    this.emit("task:failed", taskResult);
    this.logger.error(`Task failed: ${task.id} after ${task.retryCount} retries: ${error.message}`);
  }
  calculateRetryDelay(attempt) {
    return this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
  }
  insertTaskByPriority(task) {
    let insertIndex = 0;
    for (let i = 0;i < this.taskQueue.length; i++) {
      if (task.priority > this.taskQueue[i].priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    this.taskQueue.splice(insertIndex, 0, task);
  }
  getWorkerForTask(taskId) {
    for (const [workerId, worker] of this.workers) {
      if (worker.currentTask?.id === taskId) {
        return workerId;
      }
    }
    return null;
  }
  freeWorker(workerId) {
    if (!workerId)
      return;
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.busy = false;
      worker.currentTask = undefined;
      this.emit("worker:available", workerId);
    }
  }
  generateTaskId() {
    this.taskCounter++;
    return `task-${this.taskCounter}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  getMetrics() {
    const activeWorkers = Array.from(this.workers.values()).filter((w) => w.busy).length;
    return {
      totalTasks: this.taskCounter,
      pendingTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      failedTasks: this.failedTasks.size,
      activeWorkers,
      availableWorkers: this.workers.size - activeWorkers,
      averageExecutionTime: this.calculateAverageExecutionTime()
    };
  }
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.logger.info("Task scheduler configuration updated");
  }
  async shutdown() {
    try {
      this.logger.info("Shutting down task scheduler");
      const tasksToCancel = [...this.taskQueue];
      for (const task of tasksToCancel) {
        try {
          this.cancelTask(task.id);
        } catch (error) {
          this.logger.debug(`Failed to cancel task ${task.id}:`, error);
        }
      }
      const maxWaitTime = 5000;
      const startTime = Date.now();
      while (Array.from(this.workers.values()).some((w) => w.busy) && Date.now() - startTime < maxWaitTime) {
        await this.sleep(100);
      }
      this.workers.clear();
      this.logger.info("Task scheduler shutdown complete");
    } catch (error) {
      this.logger.error("Error during shutdown:", error);
    }
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  calculateAverageExecutionTime() {
    const completedTasks = Array.from(this.completedTasks.values());
    if (completedTasks.length === 0)
      return 0;
    const totalTime = completedTasks.reduce((sum, task) => sum + task.executionTime, 0);
    return totalTime / completedTasks.length;
  }
  getTaskStatistics() {
    const metrics = this.getMetrics();
    const allTasks = Array.from(this.completedTasks.values()).concat(Array.from(this.failedTasks.values()));
    const byPriority = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0
    };
    const executionTimes = [];
    allTasks.forEach((taskResult) => {
      const priority = taskResult.task.priority;
      if (priority <= 3)
        byPriority.low++;
      else if (priority <= 7)
        byPriority.normal++;
      else if (priority <= 12)
        byPriority.high++;
      else
        byPriority.critical++;
      if (taskResult.executionTime > 0) {
        executionTimes.push(taskResult.executionTime);
      }
    });
    return {
      totalTasks: metrics.totalTasks,
      pendingTasks: metrics.pendingTasks,
      runningTasks: metrics.runningTasks,
      completedTasks: metrics.completedTasks,
      failedTasks: metrics.failedTasks,
      averageExecutionTime: metrics.averageExecutionTime,
      byPriority,
      executionTimes
    };
  }
  cleanupCompletedTasks(olderThanMs = 0) {
    let cleanedCount = 0;
    if (olderThanMs === 0) {
      cleanedCount = this.completedTasks.size;
      this.completedTasks.clear();
    } else {
      const cutoffTime = Date.now() - olderThanMs;
      for (const [taskId, result] of this.completedTasks) {
        const completedAt = result.task.completedAt || result.task.createdAt;
        if (completedAt && completedAt.getTime() < cutoffTime) {
          this.completedTasks.delete(taskId);
          cleanedCount++;
        }
      }
    }
    this.logger.debug(`Cleaned up ${cleanedCount} completed tasks`);
    return cleanedCount;
  }
}
// ../../packages/core/src/analysis/analysis-context.ts
class AnalysisContextManager {
  contexts = new Map;
  contextsBySession = new Map;
  logger;
  constructor(logger) {
    this.logger = logger;
  }
  registerContext(context) {
    this.contexts.set(context.analysisId, context);
    const sessionContexts = this.contextsBySession.get(context.sessionId) || [];
    sessionContexts.push(context);
    this.contextsBySession.set(context.sessionId, sessionContexts);
    this.logger.debug(`Registered context: ${context.analysisId} in session: ${context.sessionId}`);
  }
  unregisterContext(analysisId) {
    const context = this.contexts.get(analysisId);
    if (!context)
      return;
    this.contexts.delete(analysisId);
    const sessionContexts = this.contextsBySession.get(context.sessionId) || [];
    const index = sessionContexts.findIndex((c) => c.analysisId === analysisId);
    if (index !== -1) {
      sessionContexts.splice(index, 1);
    }
    if (sessionContexts.length === 0) {
      this.contextsBySession.delete(context.sessionId);
    }
    this.logger.debug(`Unregistered context: ${analysisId}`);
  }
  getContext(analysisId) {
    return this.contexts.get(analysisId);
  }
  getSessionContexts(sessionId) {
    return this.contextsBySession.get(sessionId) || [];
  }
  getAllContexts() {
    return Array.from(this.contexts.values());
  }
  cleanupOldContexts(maxAge = 3600000) {
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;
    for (const [analysisId, context] of this.contexts) {
      if (context.startTime.getTime() < cutoffTime) {
        this.unregisterContext(analysisId);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old contexts`);
    }
    return cleanedCount;
  }
  getStatistics() {
    const contexts = Array.from(this.contexts.values());
    const sessions = Array.from(this.contextsBySession.keys());
    const stats = {
      totalContexts: contexts.length,
      totalSessions: sessions.length,
      averageContextsPerSession: sessions.length > 0 ? contexts.length / sessions.length : 0
    };
    if (contexts.length > 0) {
      const oldest = contexts.reduce((oldest2, context) => context.startTime < oldest2.startTime ? context : oldest2);
      const newest = contexts.reduce((newest2, context) => context.startTime > newest2.startTime ? context : newest2);
      stats.oldestContext = oldest.startTime;
      stats.newestContext = newest.startTime;
    }
    return stats;
  }
  clear() {
    this.contexts.clear();
    this.contextsBySession.clear();
    this.logger.info("All contexts cleared");
  }
}
// ../../packages/core/src/analysis/result-normalizer.ts
class ResultNormalizer {
  rules = new Map;
  logger;
  constructor(logger) {
    this.logger = logger;
    this.initializeDefaultRules();
  }
  normalizeResult(result, toolVersion = "unknown") {
    const startTime = new Date;
    const endTime = new Date(startTime.getTime() + result.executionTime);
    const rule = this.rules.get(result.toolName);
    if (!rule) {
      this.logger.warn(`No normalization rule found for tool: ${result.toolName}`);
      return this.createFallbackNormalization(result, toolVersion, startTime, endTime);
    }
    try {
      const normalizedIssues = this.normalizeIssues(result.issues, rule);
      const normalizedMetrics = this.normalizeMetrics(result.metrics, rule, result);
      const summary = this.createSummary(normalizedIssues, normalizedMetrics);
      const normalizedResult = {
        toolName: result.toolName,
        toolVersion,
        status: this.determineStatus(result.status, normalizedIssues),
        executionTime: result.executionTime,
        startTime,
        endTime,
        issues: normalizedIssues,
        metrics: normalizedMetrics,
        summary,
        configuration: {},
        metadata: {
          originalStatus: result.status,
          normalizedAt: new Date,
          ruleApplied: rule.toolName
        }
      };
      this.logger.debug(`Normalized result for tool: ${result.toolName}`);
      return normalizedResult;
    } catch (error) {
      this.logger.error(`Failed to normalize result for ${result.toolName}:`, error);
      return this.createFallbackNormalization(result, toolVersion, startTime, endTime);
    }
  }
  normalizeResults(results) {
    return results.map((result) => this.normalizeResult(result));
  }
  addRule(rule) {
    this.rules.set(rule.toolName, rule);
    this.logger.debug(`Added normalization rule for tool: ${rule.toolName}`);
  }
  removeRule(toolName) {
    const removed = this.rules.delete(toolName);
    if (removed) {
      this.logger.debug(`Removed normalization rule for tool: ${toolName}`);
    }
    return removed;
  }
  getRules() {
    return Array.from(this.rules.values());
  }
  hasRule(toolName) {
    return this.rules.has(toolName);
  }
  getStatistics() {
    return {
      totalRules: this.rules.size,
      supportedTools: Array.from(this.rules.keys()),
      lastUpdated: new Date
    };
  }
  sanitizeStatus(status) {
    const validStatuses = ["success", "error", "warning", "partial"];
    if (validStatuses.includes(status)) {
      return status;
    }
    return "error";
  }
  initializeDefaultRules() {
    this.addRule({
      toolName: "eslint",
      severityMapping: {
        error: "error",
        warning: "warning",
        info: "info"
      },
      categoryMapping: {
        "best-practices": "linting",
        errors: "linting",
        style: "linting",
        variables: "linting",
        imports: "linting",
        "eslint-comments": "linting",
        "no-unused-vars": "linting"
      },
      scoreMapping: {
        error: 100,
        warning: 50,
        info: 10
      },
      pathNormalization: (path) => {
        let normalized = path.replace(/\\/g, "/");
        normalized = normalized.replace(/^\.\//, "");
        normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        normalized = normalized.replace(/^[^\/]*\/\.\.\//g, "");
        while (normalized.includes("/../")) {
          normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        }
        return normalized;
      },
      messageNormalization: (message) => message.trim()
    });
    this.addRule({
      toolName: "prettier",
      severityMapping: {
        warning: "warning"
      },
      categoryMapping: {
        format: "formatting",
        style: "formatting",
        "code style": "formatting"
      },
      scoreMapping: {
        warning: 25
      },
      pathNormalization: (path) => {
        let normalized = path.replace(/\\/g, "/");
        normalized = normalized.replace(/^\.\//, "");
        normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        normalized = normalized.replace(/^[^\/]*\/\.\.\//g, "");
        while (normalized.includes("/../")) {
          normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        }
        return normalized;
      },
      messageNormalization: (message) => `Code formatting issue: ${message}`
    });
    this.addRule({
      toolName: "typescript",
      severityMapping: {
        error: "error",
        warning: "warning"
      },
      categoryMapping: {
        "type-checking": "typescript",
        declaration: "typescript",
        module: "typescript",
        jsx: "typescript",
        generics: "typescript",
        TS2339: "typescript"
      },
      scoreMapping: {
        error: 100,
        warning: 60
      },
      pathNormalization: (path) => {
        let normalized = path.replace(/\\/g, "/");
        normalized = normalized.replace(/^\.\//, "");
        normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        normalized = normalized.replace(/^[^\/]*\/\.\.\//g, "");
        while (normalized.includes("/../")) {
          normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        }
        return normalized;
      },
      messageNormalization: (message) => message.replace(/^TS\d+:\s*/, "")
    });
    this.addRule({
      toolName: "bun-test",
      severityMapping: {
        error: "error",
        warning: "warning"
      },
      categoryMapping: {
        test: "Testing",
        coverage: "Code Coverage",
        assertion: "Test Assertions"
      },
      scoreMapping: {
        error: 100,
        warning: 40
      },
      pathNormalization: (path) => {
        let normalized = path.replace(/\\/g, "/");
        normalized = normalized.replace(/^\.\//, "");
        normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        normalized = normalized.replace(/^[^\/]*\/\.\.\//g, "");
        while (normalized.includes("/../")) {
          normalized = normalized.replace(/\/[^\/]+\/\.\.\//g, "/");
        }
        return normalized;
      },
      messageNormalization: (message) => message.trim()
    });
  }
  normalizeIssues(issues, rule) {
    return issues.map((issue) => {
      const mappedSeverity = rule.severityMapping[issue.type];
      const normalizedSeverity = mappedSeverity || this.getDefaultSeverity(issue.type);
      const normalizedMessage = rule.messageNormalization(issue.message);
      const normalizedPath = rule.pathNormalization(issue.filePath);
      const category = this.categorizeIssue(issue, rule);
      const tags = this.generateTags(issue, normalizedSeverity, category);
      return {
        id: issue.id,
        toolName: issue.toolName,
        severity: normalizedSeverity,
        category,
        filePath: normalizedPath,
        lineNumber: issue.lineNumber,
        message: normalizedMessage,
        originalMessage: issue.message,
        ruleId: issue.ruleId,
        fixable: issue.fixable,
        suggestion: issue.suggestion,
        score: this.calculateNormalizedScore(issue, rule),
        tags,
        metadata: {
          originalSeverity: issue.type,
          originalScore: issue.score,
          normalizedAt: new Date
        }
      };
    });
  }
  normalizeMetrics(metrics, rule, result) {
    return {
      toolName: result.toolName,
      executionTime: result.executionTime,
      issuesCount: metrics.issuesCount,
      errorsCount: metrics.errorsCount,
      warningsCount: metrics.warningsCount,
      infoCount: metrics.infoCount,
      fixableCount: metrics.fixableCount,
      score: metrics.score,
      coverage: metrics.coverage,
      customMetrics: this.extractCustomMetrics(metrics),
      performance: {
        filesProcessed: this.estimateFilesProcessed(result),
        linesOfCode: this.estimateLinesOfCode(result)
      }
    };
  }
  createSummary(issues, metrics) {
    const criticalIssues = issues.filter((i) => i.severity === "error" && i.score >= 80).length;
    const majorIssues = issues.filter((i) => i.severity === "error" && i.score < 80).length;
    const minorIssues = issues.filter((i) => i.severity === "warning" || i.severity === "info").length;
    return {
      totalIssues: issues.length,
      criticalIssues,
      majorIssues,
      minorIssues,
      fixableIssues: issues.filter((i) => i.fixable).length,
      coveragePercentage: metrics.coverage?.lines.percentage
    };
  }
  determineStatus(originalStatus, issues) {
    if (originalStatus === "error")
      return "error";
    if (originalStatus === "warning")
      return "warning";
    if (originalStatus === "success")
      return "success";
    const hasErrors = issues.some((i) => i.severity === "error");
    const hasWarnings = issues.some((i) => i.severity === "warning");
    if (hasErrors)
      return "partial";
    if (hasWarnings)
      return "warning";
    return "success";
  }
  categorizeIssue(issue, rule) {
    if (issue.ruleId) {
      for (const [pattern, category] of Object.entries(rule.categoryMapping)) {
        if (issue.ruleId.includes(pattern)) {
          return category;
        }
      }
    }
    const message = issue.message.toLowerCase();
    for (const [pattern, category] of Object.entries(rule.categoryMapping)) {
      if (message.includes(pattern)) {
        return category;
      }
    }
    return "general";
  }
  generateTags(issue, severity, category) {
    const tags = [severity, category];
    if (issue.fixable) {
      tags.push("fixable");
    }
    if (issue.ruleId) {
      tags.push(`rule:${issue.ruleId}`);
    }
    const extension = issue.filePath.split(".").pop();
    if (extension) {
      tags.push(`type:${extension}`);
    }
    return tags;
  }
  calculateNormalizedScore(issue, rule) {
    const hasExplicitScoreMapping = rule.scoreMapping[issue.type];
    const baseScore = hasExplicitScoreMapping ? rule.scoreMapping[issue.type] : issue.score;
    let score = baseScore;
    if (!hasExplicitScoreMapping) {
      if (issue.fixable) {
        score *= 0.8;
      }
      if (issue.suggestion) {
        score *= 0.9;
      }
    }
    return Math.round(score);
  }
  extractCustomMetrics(metrics) {
    const custom = {};
    for (const [key, value] of Object.entries(metrics)) {
      if (!["issuesCount", "errorsCount", "warningsCount", "infoCount", "fixableCount", "score", "coverage"].includes(key)) {
        custom[key] = value;
      }
    }
    return custom;
  }
  estimateFilesProcessed(result) {
    if (!result.issues || result.issues.length === 0) {
      return 0;
    }
    const uniqueFiles = new Set(result.issues.map((issue) => issue.filePath));
    return uniqueFiles.size;
  }
  estimateLinesOfCode(result) {
    if (!result.issues || result.issues.length === 0) {
      return 0;
    }
    return result.issues.length * 50;
  }
  createFallbackNormalization(result, toolVersion, startTime, endTime) {
    const issues = result.issues || [];
    const metrics = result.metrics || {
      issuesCount: 0,
      errorsCount: 0,
      warningsCount: 0,
      infoCount: 0,
      fixableCount: 0,
      score: 0
    };
    const executionTime = Math.max(0, result.executionTime || 0);
    const normalizedIssues = issues.map((issue) => ({
      id: issue.id,
      toolName: issue.toolName,
      severity: this.getDefaultSeverity(issue.type),
      category: "general",
      filePath: issue.filePath ? issue.filePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/[^\/]+\/\.\.\//g, "/").replace(/[^\/]+\/\.\.\//g, "") : issue.filePath,
      lineNumber: issue.lineNumber,
      message: issue.message.trim(),
      originalMessage: issue.message,
      ruleId: issue.ruleId,
      fixable: issue.fixable,
      suggestion: issue.suggestion,
      score: issue.score,
      tags: [issue.type, "general"],
      metadata: {
        originalSeverity: issue.type,
        originalScore: issue.score,
        normalizedAt: new Date,
        fallbackNormalization: true
      }
    }));
    const summary = this.createSummary(normalizedIssues, {
      toolName: result.toolName,
      executionTime: result.executionTime,
      issuesCount: metrics.issuesCount,
      errorsCount: metrics.errorsCount,
      warningsCount: metrics.warningsCount,
      infoCount: metrics.infoCount,
      fixableCount: metrics.fixableCount,
      score: metrics.score,
      coverage: metrics.coverage,
      customMetrics: {},
      performance: {
        filesProcessed: this.estimateFilesProcessed(result),
        linesOfCode: this.estimateLinesOfCode(result)
      }
    });
    return {
      toolName: result.toolName,
      toolVersion,
      status: this.sanitizeStatus(result.status),
      executionTime,
      startTime,
      endTime,
      issues: normalizedIssues,
      metrics: {
        toolName: result.toolName,
        executionTime,
        issuesCount: metrics.issuesCount,
        errorsCount: metrics.errorsCount,
        warningsCount: metrics.warningsCount,
        infoCount: metrics.infoCount,
        fixableCount: metrics.fixableCount,
        score: metrics.score,
        coverage: metrics.coverage,
        customMetrics: {},
        performance: {
          filesProcessed: this.estimateFilesProcessed(result),
          linesOfCode: this.estimateLinesOfCode(result)
        }
      },
      summary,
      configuration: {},
      metadata: {
        originalStatus: result.status,
        normalizedAt: new Date,
        fallbackNormalization: true
      }
    };
  }
  addNormalizationRule(rule) {
    this.rules.set(rule.toolName, rule);
    this.logger.debug(`Added normalization rule for tool: ${rule.toolName}`);
  }
  removeNormalizationRule(toolName) {
    const removed = this.rules.delete(toolName);
    if (removed) {
      this.logger.debug(`Removed normalization rule for tool: ${toolName}`);
    }
    return removed;
  }
  hasNormalizationRule(toolName) {
    return this.rules.has(toolName);
  }
  getAllNormalizationRules() {
    return new Map(this.rules);
  }
  createEmptyNormalizedResult(toolName) {
    const startTime = new Date;
    const endTime = new Date;
    return {
      toolName,
      toolVersion: "unknown",
      status: "success",
      executionTime: 0,
      startTime,
      endTime,
      issues: [],
      metrics: {
        toolName,
        executionTime: 0,
        issuesCount: 0,
        errorsCount: 0,
        warningsCount: 0,
        infoCount: 0,
        fixableCount: 0,
        score: 100,
        customMetrics: {},
        performance: {
          filesProcessed: 0,
          linesOfCode: 0
        }
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        majorIssues: 0,
        minorIssues: 0,
        fixableIssues: 0,
        coveragePercentage: 100
      },
      configuration: {},
      metadata: {
        normalizedAt: new Date
      }
    };
  }
  getDefaultSeverity(type) {
    switch (type) {
      case "error":
      case "bug":
      case "critical":
        return "error";
      case "warning":
      case "style":
      case "suggestion":
        return "warning";
      case "info":
      case "note":
        return "info";
      default:
        return "error";
    }
  }
  mergeNormalizedResults(results) {
    if (results.length === 0) {
      return this.createEmptyNormalizedResult("merged");
    }
    const startTime = new Date(Math.min(...results.map((r) => r.startTime.getTime())));
    const endTime = new Date(Math.max(...results.map((r) => r.endTime.getTime())));
    const allIssues = results.flatMap((r) => r.issues);
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const mergedIssues = allIssues.map((issue, index) => ({
      ...issue,
      id: issue.id || `merged-${index}`
    }));
    const mergedMetrics = {
      toolName: "merged",
      executionTime: totalExecutionTime,
      issuesCount: allIssues.length,
      errorsCount: allIssues.filter((i) => i.severity === "error").length,
      warningsCount: allIssues.filter((i) => i.severity === "warning").length,
      infoCount: allIssues.filter((i) => i.severity === "info").length,
      fixableCount: allIssues.filter((i) => i.fixable).length,
      score: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.metrics.score, 0) / results.length) : 100,
      totalIssues: allIssues.length,
      customMetrics: {},
      performance: {
        filesProcessed: results.reduce((sum, r) => sum + (r.metrics.performance?.filesProcessed || 0), 0),
        linesOfCode: results.reduce((sum, r) => sum + (r.metrics.performance?.linesOfCode || 0), 0)
      }
    };
    const summary = {
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter((i) => i.score >= 80).length,
      majorIssues: allIssues.filter((i) => i.score >= 60 && i.score < 80).length,
      minorIssues: allIssues.filter((i) => i.score < 60).length,
      fixableIssues: allIssues.filter((i) => i.fixable).length,
      coveragePercentage: undefined
    };
    return {
      toolName: "merged",
      toolVersion: "unknown",
      status: results.every((r) => r.status === "success") ? "success" : "partial",
      executionTime: totalExecutionTime,
      startTime,
      endTime,
      issues: mergedIssues,
      metrics: mergedMetrics,
      summary,
      configuration: {},
      metadata: {
        normalizedAt: new Date,
        mergedFrom: results.map((r) => r.toolName)
      }
    };
  }
}
// ../../packages/core/src/analysis/performance-optimizer.ts
class PerformanceOptimizer {
  config;
  logger;
  metrics;
  startTime = 0;
  memorySnapshots = [];
  cpuSnapshots = [];
  cache = new Map;
  taskTimers = new Map;
  taskMetrics = [];
  memoryUsageHistory = [];
  monitoringInterval = null;
  monitor = {
    isMonitoring: false,
    startTime: 0,
    taskCount: 0,
    averagePerformance: 0
  };
  appliedOptimizations = [];
  concurrencyTracking = {
    current: 0,
    peak: 0,
    total: 0
  };
  defaultConfig = {
    maxConcurrency: 10,
    maxMemoryUsage: 1024 * 1024 * 1024,
    taskTimeout: 30000,
    optimizationThreshold: 1000,
    enableAutoOptimization: true,
    monitoringInterval: 5000
  };
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.startTime = Date.now();
    this.metrics = {
      executionTime: 0,
      memoryUsage: {
        peak: 0,
        average: 0,
        final: 0
      },
      cpuUsage: {
        peak: 0,
        average: 0
      },
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      throughput: {
        tasksPerSecond: 0,
        filesPerSecond: 0
      },
      resourceUtilization: {
        cpu: 0,
        memory: 0,
        workers: 0
      }
    };
  }
  startTaskTimer(taskId) {
    const timer = {
      startTime: Date.now(),
      endTime: 0,
      executionTime: 0,
      memoryUsage: 0,
      memoryPeak: 0
    };
    this.taskTimers.set(taskId, timer);
    this.concurrencyTracking.current++;
    this.concurrencyTracking.total++;
    this.concurrencyTracking.peak = Math.max(this.concurrencyTracking.peak, this.concurrencyTracking.current);
  }
  endTaskTimer(taskId) {
    const timer = this.taskTimers.get(taskId);
    if (!timer) {
      return null;
    }
    timer.endTime = Date.now();
    timer.executionTime = timer.endTime - timer.startTime;
    timer.memoryUsage = process.memoryUsage().heapUsed;
    timer.memoryPeak = Math.max(timer.memoryUsage, timer.memoryPeak);
    this.taskTimers.delete(taskId);
    this.concurrencyTracking.current = Math.max(0, this.concurrencyTracking.current - 1);
    const metrics = {
      executionTime: timer.executionTime,
      memoryUsage: timer.memoryUsage,
      memoryPeak: timer.memoryPeak,
      cpuUsage: 0,
      diskIO: {
        readBytes: 0,
        writeBytes: 0
      },
      timestamp: Date.now(),
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      throughput: {
        tasksPerSecond: 0,
        filesPerSecond: 0
      },
      resourceUtilization: {
        cpu: 0,
        memory: timer.memoryUsage,
        workers: 1
      }
    };
    this.taskMetrics.push(metrics);
    return metrics;
  }
  getCurrentConcurrency() {
    return this.concurrencyTracking.current;
  }
  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    return {
      executionTime: Date.now() - this.startTime,
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: 0,
      diskIO: {
        readBytes: 0,
        writeBytes: 0
      },
      timestamp: Date.now(),
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRate: 0
      },
      throughput: {
        tasksPerSecond: this.taskMetrics.length > 0 ? this.taskMetrics.length / ((Date.now() - this.startTime) / 1000) : 0,
        filesPerSecond: 0
      },
      resourceUtilization: {
        cpu: 0,
        memory: memoryUsage.heapUsed,
        workers: this.concurrencyTracking.current
      }
    };
  }
  analyzePerformancePatterns() {
    const patterns = [];
    if (this.taskMetrics.length > 0) {
      const avgExecutionTime = this.taskMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.taskMetrics.length;
      if (avgExecutionTime > 1000) {
        patterns.push({
          pattern: "slow-execution",
          severity: "high",
          recommendation: "Consider optimizing slow tasks or increasing parallelization"
        });
      }
    }
    return patterns;
  }
  detectBottlenecks() {
    const bottlenecks = [];
    const systemMetrics = this.getSystemMetrics();
    if (systemMetrics.memoryUsage.final > 500 * 1024 * 1024) {
      bottlenecks.push({
        type: "memory",
        impact: "high",
        description: "High memory usage detected"
      });
    }
    return bottlenecks;
  }
  calculatePerformanceScore() {
    const systemMetrics = this.getSystemMetrics();
    let score = 100;
    if (systemMetrics.memoryUsage.final > 100 * 1024 * 1024) {
      score -= 20;
    }
    if (systemMetrics.executionTime > 5000) {
      score -= 15;
    }
    return Math.max(0, score);
  }
  getPerformanceScoreBreakdown() {
    const total = this.calculatePerformanceScore();
    return {
      total,
      memory: Math.max(0, 100 - this.getSystemMetrics().memoryUsage.final / (1024 * 1024 * 100)),
      speed: Math.max(0, 100 - this.getSystemMetrics().executionTime / 100),
      efficiency: total
    };
  }
  getOptimizationRecommendations() {
    const recommendations = [];
    const systemMetrics = this.getSystemMetrics();
    if (systemMetrics.memoryUsage.final > 100 * 1024 * 1024) {
      recommendations.push({
        type: "resource",
        priority: "high",
        title: "High Memory Usage",
        description: "Memory usage is above recommended threshold",
        impact: "Reduced performance and potential out-of-memory errors",
        effort: "medium",
        implementation: "Implement memory pooling and reduce object creation"
      });
    }
    return recommendations;
  }
  recordMemoryUsage(taskId, memoryUsage) {
    const memoryRecord = process.memoryUsage();
    const timestamp = Date.now();
    this.memoryUsageHistory.push({
      timestamp,
      rss: memoryRecord.rss,
      heapUsed: memoryUsage || memoryRecord.heapUsed,
      heapTotal: memoryRecord.heapTotal,
      external: memoryRecord.external,
      arrayBuffers: memoryRecord.arrayBuffers
    });
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory = this.memoryUsageHistory.slice(-100);
    }
    return memoryUsage || memoryRecord.heapUsed;
  }
  enableAutoOptimization(enabled) {
    if (this.config.monitoring) {
      this.config.monitoring.enableProfiling = enabled;
    }
    if (enabled) {
      this.appliedOptimizations.push("auto-optimization-enabled");
    }
  }
  getAppliedOptimizations() {
    return [...this.appliedOptimizations];
  }
  calculateOptimizationEffectiveness() {
    if (this.taskMetrics.length < 2) {
      return { beforeOptimization: 0, afterOptimization: 0, improvement: 0 };
    }
    const before = this.taskMetrics[0].executionTime;
    const after = this.taskMetrics[this.taskMetrics.length - 1].executionTime;
    const improvement = before > 0 ? (before - after) / before * 100 : 0;
    return { beforeOptimization: before, afterOptimization: after, improvement };
  }
  startPerformanceMonitoring() {
    this.monitor.isMonitoring = true;
    this.monitor.startTime = Date.now();
    this.monitor.taskCount = 0;
    this.monitor.averagePerformance = 0;
    this.monitoringInterval = setInterval(() => {
      this.monitor.taskCount = this.taskMetrics.length;
      this.monitor.averagePerformance = this.taskMetrics.length > 0 ? this.taskMetrics.reduce((sum, m) => sum + m.executionTime, 0) / this.taskMetrics.length : 0;
    }, this.defaultConfig.monitoringInterval);
    return this.monitor;
  }
  getMonitoringData() {
    return this.monitor;
  }
  stopPerformanceMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitor.isMonitoring = false;
  }
  generatePerformanceReport() {
    const systemMetrics = this.getSystemMetrics();
    const recommendations = this.getOptimizationRecommendations();
    const scoreBreakdown = this.getPerformanceScoreBreakdown();
    return {
      summary: systemMetrics,
      recommendations,
      scoreBreakdown
    };
  }
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: [...this.taskMetrics],
      config: { ...this.config },
      version: "1.0.0",
      metadata: {
        generatedAt: new Date().toISOString(),
        totalTasks: this.taskMetrics.length,
        optimizationsApplied: this.appliedOptimizations.length
      }
    };
  }
  updateConfig(newConfig) {
    if (newConfig.optimizationThresholds) {
      const thresholds = newConfig.optimizationThresholds;
      if (thresholds.slowTaskThreshold <= 0 || thresholds.memoryThreshold <= 0 || thresholds.cpuThreshold > 100 || thresholds.diskIOLatencyThreshold <= 0) {
        throw new Error("Invalid configuration: negative or out-of-range values");
      }
    }
    if (!this.validateConfig({ ...this.defaultConfig, ...newConfig })) {
      throw new Error("Invalid configuration");
    }
    Object.assign(this.defaultConfig, newConfig);
  }
  resetToDefaults() {
    this.defaultConfig = {
      maxConcurrency: 10,
      maxMemoryUsage: 1024 * 1024 * 1024,
      taskTimeout: 30000,
      optimizationThreshold: 1000,
      enableAutoOptimization: true,
      enableMetrics: true,
      monitoringInterval: 5000
    };
  }
  getCurrentConfig() {
    return { ...this.defaultConfig };
  }
  getAllMetrics() {
    return [...this.taskMetrics];
  }
  cleanupOldMetrics(cutoffTime) {
    this.taskMetrics = this.taskMetrics.filter((metric) => metric.executionTime > cutoffTime);
  }
  resetMetrics() {
    this.taskMetrics.length = 0;
    this.memoryUsageHistory.length = 0;
    this.appliedOptimizations.length = 0;
    this.concurrencyTracking = {
      current: 0,
      peak: 0,
      total: 0
    };
  }
  cleanup() {
    this.stopPerformanceMonitoring();
    this.cache.clear();
    if (this.taskMetrics.length > 100) {
      this.taskMetrics = this.taskMetrics.slice(-100);
    }
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory = this.memoryUsageHistory.slice(-100);
    }
  }
  validateConfig(config) {
    try {
      return config.maxConcurrency > 0 && config.maxMemoryUsage > 0 && config.taskTimeout > 0 && config.optimizationThreshold >= 0 && config.monitoringInterval >= 1000;
    } catch {
      return false;
    }
  }
}
// ../../packages/core/src/analysis/resource-manager.ts
import { EventEmitter as EventEmitter3 } from "events";

class ResourceManager extends EventEmitter3 {
  config;
  logger;
  stats;
  monitoring = false;
  monitoringInterval = null;
  resourceQueue = [];
  allocatedResources = new Map;
  lastCpuUsage = { user: 0, system: 0 };
  throttled = false;
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.stats = this.initializeStats();
  }
  startMonitoring(intervalMs = 1000) {
    if (this.monitoring) {
      this.logger.warn("Resource monitoring is already active");
      return;
    }
    this.monitoring = true;
    this.updateStats();
    this.monitoringInterval = setInterval(() => {
      this.updateStats();
      this.checkThresholds();
      this.processResourceQueue();
    }, intervalMs);
    this.logger.info("Resource monitoring started");
  }
  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }
    this.monitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.info("Resource monitoring stopped");
  }
  requestResource(request) {
    const requestId = this.generateRequestId();
    const fullRequest = {
      ...request,
      id: requestId,
      createdAt: new Date
    };
    if (this.canAllocateResource(request.type, request.amount)) {
      this.allocateResource(requestId, request.type, request.amount);
      request.callback(true);
    } else {
      this.resourceQueue.push(fullRequest);
      this.logger.debug(`Resource request queued: ${requestId} (${request.type}: ${request.amount})`);
    }
    return requestId;
  }
  releaseResource(requestId) {
    const allocation = this.allocatedResources.get(requestId);
    if (!allocation) {
      this.logger.warn(`Attempted to release non-existent resource allocation: ${requestId}`);
      return false;
    }
    this.allocatedResources.delete(requestId);
    this.logger.debug(`Resource released: ${requestId} (${allocation.type}: ${allocation.amount})`);
    this.processResourceQueue();
    return true;
  }
  getStats() {
    return { ...this.stats };
  }
  isUnderPressure() {
    return this.stats.memory.percentage > 80 || this.stats.cpu.usage > 80 || this.throttled;
  }
  getUtilizationReport() {
    const memoryStatus = this.getResourceStatus(this.stats.memory.percentage, this.config.memory.warningThreshold, this.config.memory.criticalThreshold);
    const cpuStatus = this.getResourceStatus(this.stats.cpu.usage, this.config.cpu.warningThreshold, this.config.cpu.warningThreshold);
    const allocationsByType = new Map;
    for (const allocation of this.allocatedResources.values()) {
      allocationsByType.set(allocation.type, (allocationsByType.get(allocation.type) || 0) + allocation.amount);
    }
    const oldestRequest = this.resourceQueue.length > 0 ? this.resourceQueue[0].createdAt : undefined;
    const recommendations = this.generateRecommendations(memoryStatus, cpuStatus);
    return {
      memory: {
        used: this.stats.memory.used,
        available: this.stats.memory.free,
        percentage: this.stats.memory.percentage,
        status: memoryStatus
      },
      cpu: {
        usage: this.stats.cpu.usage,
        status: cpuStatus
      },
      allocations: {
        total: this.allocatedResources.size,
        byType: Object.fromEntries(allocationsByType)
      },
      queue: {
        length: this.resourceQueue.length,
        oldestRequest
      },
      recommendations
    };
  }
  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      this.logger.info("Manual garbage collection triggered");
      return true;
    } else {
      this.logger.warn("Garbage collection not available");
      return false;
    }
  }
  setThrottling(enabled) {
    this.throttled = enabled;
    this.logger.info(`Throttling ${enabled ? "enabled" : "disabled"}`);
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("Resource configuration updated");
  }
  initializeStats() {
    const memUsage = process.memoryUsage();
    const totalMemory = __require("os").totalmem();
    const freeMemory = __require("os").freemem();
    return {
      memory: {
        used: Math.round(memUsage.heapUsed / (1024 * 1024)),
        free: Math.round(freeMemory / (1024 * 1024)),
        total: Math.round(totalMemory / (1024 * 1024)),
        percentage: 0
      },
      cpu: {
        usage: 0,
        cores: __require("os").cpus().length,
        loadAverage: __require("os").loadavg()
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: memUsage,
        cpuUsage: process.cpuUsage()
      },
      timestamp: new Date
    };
  }
  updateStats() {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const totalMemory = __require("os").totalmem();
    const freeMemory = __require("os").freemem();
    const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
    const usedMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    const freeMB = Math.round(freeMemory / (1024 * 1024));
    const totalMB = Math.round(totalMemory / (1024 * 1024));
    this.stats.memory = {
      used: usedMB,
      free: freeMB,
      total: totalMB,
      percentage: usedMB / totalMB * 100
    };
    const timeDelta = now - this.stats.timestamp.getTime();
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / timeDelta * 100;
    this.stats.cpu = {
      usage: Math.min(100, Math.max(0, cpuPercent * this.stats.cpu.cores / 100)),
      cores: this.stats.cpu.cores,
      loadAverage: __require("os").loadavg()
    };
    this.stats.process = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: memUsage,
      cpuUsage: currentCpuUsage
    };
    this.stats.timestamp = new Date;
    this.lastCpuUsage = currentCpuUsage;
  }
  checkThresholds() {
    if (this.stats.memory.percentage > this.config.memory.criticalThreshold) {
      this.emit("memory:critical", this.stats.memory);
      this.logger.error(`Critical memory usage: ${this.stats.memory.percentage.toFixed(1)}%`);
    } else if (this.stats.memory.percentage > this.config.memory.warningThreshold) {
      this.emit("memory:warning", this.stats.memory);
      this.logger.warn(`High memory usage: ${this.stats.memory.percentage.toFixed(1)}%`);
    }
    if (this.stats.cpu.usage > this.config.cpu.maxUsage) {
      this.emit("cpu:critical", this.stats.cpu);
      this.logger.error(`Critical CPU usage: ${this.stats.cpu.usage.toFixed(1)}%`);
      if (this.config.cpu.enableThrottling && !this.throttled) {
        this.setThrottling(true);
      }
    } else if (this.stats.cpu.usage > this.config.cpu.warningThreshold) {
      this.emit("cpu:warning", this.stats.cpu);
      this.logger.warn(`High CPU usage: ${this.stats.cpu.usage.toFixed(1)}%`);
    } else if (this.throttled && this.stats.cpu.usage < this.config.cpu.throttlingThreshold) {
      this.setThrottling(false);
    }
  }
  processResourceQueue() {
    if (this.resourceQueue.length === 0) {
      return;
    }
    this.resourceQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const remainingQueue = [];
    for (const request of this.resourceQueue) {
      if (this.canAllocateResource(request.type, request.amount)) {
        this.allocateResource(request.id, request.type, request.amount);
        request.callback(true);
      } else {
        if (Date.now() - request.createdAt.getTime() > request.timeout) {
          request.callback(false);
          this.logger.debug(`Resource request timed out: ${request.id}`);
        } else {
          remainingQueue.push(request);
        }
      }
    }
    this.resourceQueue = remainingQueue;
  }
  canAllocateResource(type, amount) {
    switch (type) {
      case "memory":
        const projectedMemoryUsage = this.stats.memory.used + amount;
        return projectedMemoryUsage < this.config.memory.limit;
      case "cpu":
        return !this.throttled && this.stats.cpu.usage < this.config.cpu.maxUsage;
      case "io":
        return this.allocatedResources.size < this.config.io.maxConcurrentOperations;
      case "network":
        const networkAllocations = Array.from(this.allocatedResources.values()).filter((allocation) => allocation.type === "network").length;
        return networkAllocations < this.config.network.maxConcurrentRequests;
      default:
        return false;
    }
  }
  allocateResource(requestId, type, amount) {
    this.allocatedResources.set(requestId, { type, amount });
    this.logger.debug(`Resource allocated: ${requestId} (${type}: ${amount})`);
    this.emit("resource:allocated", { requestId, type, amount });
  }
  getResourceStatus(usage, warningThreshold, criticalThreshold) {
    if (usage >= criticalThreshold)
      return "critical";
    if (usage >= warningThreshold)
      return "warning";
    return "normal";
  }
  generateRecommendations(memoryStatus, cpuStatus) {
    const recommendations = [];
    if (memoryStatus === "critical") {
      recommendations.push("Reduce memory usage or increase memory limit");
      recommendations.push("Enable memory throttling or reduce concurrent operations");
    } else if (memoryStatus === "warning") {
      recommendations.push("Monitor memory usage closely");
    }
    if (cpuStatus === "critical") {
      recommendations.push("Reduce concurrent task execution");
      recommendations.push("Optimize tool configuration for better performance");
    } else if (cpuStatus === "warning") {
      recommendations.push("Consider enabling CPU throttling");
    }
    if (this.resourceQueue.length > 5) {
      recommendations.push("Resource queue is backing up - consider increasing limits");
    }
    if (this.throttled) {
      recommendations.push("System is currently throttled for stability");
    }
    return recommendations;
  }
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
// ../../packages/core/src/analysis/error-handler.ts
import { EventEmitter as EventEmitter4 } from "events";
var ErrorClassification;
((ErrorClassification2) => {
  ErrorClassification2["SYSTEM"] = "system";
  ErrorClassification2["CONFIGURATION"] = "configuration";
  ErrorClassification2["PLUGIN"] = "plugin";
  ErrorClassification2["NETWORK"] = "network";
  ErrorClassification2["TIMEOUT"] = "timeout";
  ErrorClassification2["RESOURCE"] = "resource";
  ErrorClassification2["VALIDATION"] = "validation";
  ErrorClassification2["UNKNOWN"] = "unknown";
})(ErrorClassification ||= {});
class ErrorHandler extends EventEmitter4 {
  config;
  logger;
  errors = [];
  stats;
  recoveryActions = new Map;
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.stats = this.initializeStats();
  }
  handleError(error, context = { phase: "unknown" }) {
    const analysisError = this.createAnalysisError(error, context);
    this.processError(analysisError);
    return analysisError;
  }
  async recoverFromError(error) {
    const startTime = Date.now();
    let attempts = 0;
    let lastError = error.originalError;
    this.logger.info(`Attempting recovery for error: ${error.code} using strategy: ${error.recoveryStrategy}`);
    try {
      switch (error.recoveryStrategy) {
        case "retry" /* RETRY */:
          return await this.retryOperation(error, startTime, attempts);
        case "fallback" /* FALLBACK */:
          return await this.executeFallback(error, startTime);
        case "degrade" /* DEGRADE */:
          return await this.executeDegradation(error, startTime);
        case "skip" /* SKIP */:
          return { success: true, strategy: "skip" /* SKIP */, attempts: 0, recoveryTime: 0 };
        case "abort" /* ABORT */:
        default:
          return { success: false, strategy: "abort" /* ABORT */, attempts: 0, recoveryTime: 0 };
      }
    } catch (recoveryError) {
      this.logger.error(`Recovery failed for error: ${error.code}`, recoveryError);
      return {
        success: false,
        strategy: error.recoveryStrategy,
        attempts,
        recoveryTime: Date.now() - startTime,
        result: recoveryError
      };
    }
  }
  registerRecoveryAction(errorCode, action) {
    this.recoveryActions.set(errorCode, action);
    this.logger.debug(`Registered recovery action for error code: ${errorCode}`);
  }
  unregisterRecoveryAction(errorCode) {
    const removed = this.recoveryActions.delete(errorCode);
    if (removed) {
      this.logger.debug(`Unregistered recovery action for error code: ${errorCode}`);
    }
    return removed;
  }
  shouldEnterDegradedMode() {
    if (!this.config.degradation.enabled) {
      return false;
    }
    const recentErrors = this.getRecentErrors(300000);
    const errorRate = recentErrors.length / 5;
    return errorRate > this.config.degradation.thresholds.errorRate || this.getConsecutiveErrors() > this.config.degradation.thresholds.consecutiveErrors || this.getAverageResponseTime() > this.config.degradation.thresholds.responseTime;
  }
  getStats() {
    this.updateStats();
    return { ...this.stats };
  }
  getRecentErrors(timeWindowMs = 300000) {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.errors.filter((error) => error.context.timestamp >= cutoffTime);
  }
  getErrorsByClassification(classification) {
    return this.errors.filter((error) => error.classification === classification);
  }
  getErrorsBySeverity(severity) {
    return this.errors.filter((error) => error.severity === severity);
  }
  getErrorsByTool(toolName) {
    return this.errors.filter((error) => error.context.toolName === toolName);
  }
  clearOldErrors(olderThanMs = 3600000) {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    const initialCount = this.errors.length;
    this.errors = this.errors.filter((error) => error.context.timestamp >= cutoffTime);
    const clearedCount = initialCount - this.errors.length;
    if (clearedCount > 0) {
      this.logger.info(`Cleared ${clearedCount} old errors`);
    }
    return clearedCount;
  }
  generateErrorReport() {
    const summary = this.getStats();
    const errorCounts = new Map;
    for (const error of this.errors) {
      const key = `${error.classification}:${error.code}`;
      const existing = errorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        errorCounts.set(key, { error, count: 1 });
      }
    }
    const topErrors = Array.from(errorCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10).map((item) => ({
      ...item,
      frequency: item.count / Math.max(1, this.errors.length)
    }));
    const recommendations = this.generateRecommendations(summary, topErrors);
    const trends = this.analyzeTrends();
    return {
      summary,
      topErrors,
      recommendations,
      trends
    };
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("Error handling configuration updated");
  }
  createAnalysisError(error, context) {
    const classification = this.classifyError(error);
    const severity = this.determineSeverity(error, classification);
    const recoveryStrategy = this.determineRecoveryStrategy(classification, severity);
    return {
      id: this.generateErrorId(),
      classification,
      severity,
      code: this.extractErrorCode(error),
      message: error.message,
      originalError: error,
      context: {
        toolName: context.toolName,
        phase: context.phase,
        timestamp: new Date,
        metadata: context.metadata || {}
      },
      recoveryStrategy,
      retryCount: 0,
      maxRetries: this.config.retry.maxAttempts,
      canRecover: recoveryStrategy !== "abort" /* ABORT */,
      suggestions: this.generateSuggestions(error, classification, recoveryStrategy)
    };
  }
  processError(error) {
    this.errors.push(error);
    if (this.errors.length > this.config.reporting.maxLogEntries) {
      this.errors = this.errors.slice(-this.config.reporting.maxLogEntries);
    }
    this.logError(error);
    this.updateStats();
    this.emit("error:occurred", error);
    this.emit(`error:${error.classification}`, error);
    if (error.severity === "critical" /* CRITICAL */) {
      this.emit("error:critical", error);
    }
    if (this.shouldEnterDegradedMode()) {
      this.emit("system:degraded");
    }
  }
  classifyError(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";
    for (const pattern of this.config.classification.patterns) {
      if (pattern.regex.test(message) || pattern.regex.test(stack)) {
        return pattern.classification;
      }
    }
    if (error.name === "TypeError" || error.name === "ReferenceError") {
      return "system" /* SYSTEM */;
    }
    if (message.includes("timeout") || message.includes("timed out")) {
      return "timeout" /* TIMEOUT */;
    }
    if (message.includes("enoent") || message.includes("file not found")) {
      return "configuration" /* CONFIGURATION */;
    }
    return "unknown" /* UNKNOWN */;
  }
  determineSeverity(error, classification) {
    const message = error.message.toLowerCase();
    for (const pattern of this.config.classification.patterns) {
      if (pattern.regex.test(message) || pattern.regex.test(error.stack?.toLowerCase() || "")) {
        return pattern.severity;
      }
    }
    switch (classification) {
      case "system" /* SYSTEM */:
      case "resource" /* RESOURCE */:
        return "high" /* HIGH */;
      case "configuration" /* CONFIGURATION */:
      case "plugin" /* PLUGIN */:
        return "medium" /* MEDIUM */;
      case "network" /* NETWORK */:
      case "timeout" /* TIMEOUT */:
        return "low" /* LOW */;
      default:
        return "medium" /* MEDIUM */;
    }
  }
  determineRecoveryStrategy(classification, severity) {
    for (const pattern of this.config.classification.patterns) {
      if (pattern.regex.test("")) {
        return pattern.recoveryStrategy;
      }
    }
    if (severity === "critical" /* CRITICAL */) {
      return "abort" /* ABORT */;
    }
    switch (classification) {
      case "network" /* NETWORK */:
      case "timeout" /* TIMEOUT */:
        return "retry" /* RETRY */;
      case "plugin" /* PLUGIN */:
        return "fallback" /* FALLBACK */;
      case "resource" /* RESOURCE */:
        return "degrade" /* DEGRADE */;
      case "validation" /* VALIDATION */:
        return "skip" /* SKIP */;
      default:
        return "retry" /* RETRY */;
    }
  }
  extractErrorCode(error) {
    const codeMatch = error.message.match(/\b[A-Z][A-Z_0-9]+\b/);
    if (codeMatch) {
      return codeMatch[0];
    }
    return error.name.replace(/Error$/, "").toUpperCase() || "UNKNOWN";
  }
  generateSuggestions(error, classification, strategy) {
    const suggestions = [];
    switch (classification) {
      case "configuration" /* CONFIGURATION */:
        suggestions.push("Check configuration files and settings");
        suggestions.push("Verify tool installation and dependencies");
        break;
      case "network" /* NETWORK */:
        suggestions.push("Check network connectivity");
        suggestions.push("Verify external service availability");
        break;
      case "timeout" /* TIMEOUT */:
        suggestions.push("Increase timeout values");
        suggestions.push("Check system resource availability");
        break;
      case "resource" /* RESOURCE */:
        suggestions.push("Free up system resources");
        suggestions.push("Reduce concurrent operations");
        break;
      case "plugin" /* PLUGIN */:
        suggestions.push("Update plugin to latest version");
        suggestions.push("Check plugin configuration");
        break;
    }
    switch (strategy) {
      case "retry" /* RETRY */:
        suggestions.push("The operation will be retried automatically");
        break;
      case "fallback" /* FALLBACK */:
        suggestions.push("A fallback method will be used");
        break;
      case "degrade" /* DEGRADE */:
        suggestions.push("System will operate in degraded mode");
        break;
    }
    return suggestions;
  }
  async retryOperation(error, startTime, attempts) {
    while (attempts < error.maxRetries) {
      attempts++;
      const delay = this.calculateRetryDelay(attempts);
      this.logger.info(`Retrying operation (attempt ${attempts}/${error.maxRetries}) after ${delay}ms`);
      await this.sleep(delay);
      try {
        return {
          success: true,
          strategy: "retry" /* RETRY */,
          attempts,
          recoveryTime: Date.now() - startTime
        };
      } catch (retryError) {
        this.logger.warn(`Retry attempt ${attempts} failed:`, retryError);
      }
    }
    return {
      success: false,
      strategy: "retry" /* RETRY */,
      attempts,
      recoveryTime: Date.now() - startTime
    };
  }
  async executeFallback(error, startTime) {
    if (!this.config.fallback.enabled) {
      return { success: false, strategy: "fallback" /* FALLBACK */, attempts: 0, recoveryTime: 0 };
    }
    const fallbackAction = this.recoveryActions.get(error.code) || this.config.fallback.strategies[error.classification];
    if (!fallbackAction) {
      this.logger.warn(`No fallback strategy available for error: ${error.code}`);
      return { success: false, strategy: "fallback" /* FALLBACK */, attempts: 0, recoveryTime: 0 };
    }
    try {
      const result = fallbackAction();
      this.logger.info(`Fallback strategy executed for error: ${error.code}`);
      return {
        success: true,
        result,
        strategy: "fallback" /* FALLBACK */,
        attempts: 1,
        recoveryTime: Date.now() - startTime
      };
    } catch (fallbackError) {
      this.logger.error(`Fallback strategy failed for error: ${error.code}`, fallbackError);
      return {
        success: false,
        strategy: "fallback" /* FALLBACK */,
        attempts: 1,
        recoveryTime: Date.now() - startTime,
        result: fallbackError
      };
    }
  }
  async executeDegradation(error, startTime) {
    if (!this.config.degradation.enabled) {
      return { success: false, strategy: "degrade" /* DEGRADE */, attempts: 0, recoveryTime: 0 };
    }
    const degradationAction = this.config.degradation.strategies[error.classification];
    if (!degradationAction) {
      this.logger.warn(`No degradation strategy available for error: ${error.code}`);
      return { success: false, strategy: "degrade" /* DEGRADE */, attempts: 0, recoveryTime: 0 };
    }
    try {
      const result = degradationAction();
      this.logger.info(`Degradation strategy executed for error: ${error.code}`);
      return {
        success: true,
        result,
        strategy: "degrade" /* DEGRADE */,
        attempts: 1,
        recoveryTime: Date.now() - startTime
      };
    } catch (degradationError) {
      this.logger.error(`Degradation strategy failed for error: ${error.code}`, degradationError);
      return {
        success: false,
        strategy: "degrade" /* DEGRADE */,
        attempts: 1,
        recoveryTime: Date.now() - startTime,
        result: degradationError
      };
    }
  }
  calculateRetryDelay(attempt) {
    let delay = this.config.retry.baseDelay * Math.pow(this.config.retry.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.retry.maxDelay);
    if (this.config.retry.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    return Math.round(delay);
  }
  logError(error) {
    const logMessage = `${error.classification.toUpperCase()} [${error.code}] ${error.message}`;
    const logData = {
      toolName: error.context.toolName,
      phase: error.context.phase,
      timestamp: error.context.timestamp,
      suggestions: error.suggestions
    };
    if (this.config.reporting.includeStackTrace) {
      logData.stackTrace = error.originalError.stack;
    }
    switch (error.severity) {
      case "critical" /* CRITICAL */:
        this.logger.error(logMessage, logData);
        break;
      case "high" /* HIGH */:
        this.logger.error(logMessage, logData);
        break;
      case "medium" /* MEDIUM */:
        this.logger.warn(logMessage, logData);
        break;
      case "low" /* LOW */:
        this.logger.info(logMessage, logData);
        break;
    }
  }
  updateStats() {
    this.stats.totalErrors = this.errors.length;
    this.stats.errorsByClassification = {};
    this.stats.errorsBySeverity = {};
    this.stats.errorsByTool = {};
    for (const error of this.errors) {
      this.stats.errorsByClassification[error.classification] = (this.stats.errorsByClassification[error.classification] || 0) + 1;
      this.stats.errorsBySeverity[error.severity] = (this.stats.errorsBySeverity[error.severity] || 0) + 1;
      if (error.context.toolName) {
        this.stats.errorsByTool[error.context.toolName] = (this.stats.errorsByTool[error.context.toolName] || 0) + 1;
      }
    }
    this.stats.recentErrors = this.getRecentErrors();
    this.stats.lastError = this.errors.length > 0 ? this.errors[this.errors.length - 1].context.timestamp : undefined;
  }
  getConsecutiveErrors() {
    if (this.errors.length === 0)
      return 0;
    let consecutive = 0;
    const now = new Date;
    for (let i = this.errors.length - 1;i >= 0; i--) {
      const error = this.errors[i];
      const timeDiff = now.getTime() - error.context.timestamp.getTime();
      if (timeDiff > 60000)
        break;
      consecutive++;
    }
    return consecutive;
  }
  getAverageResponseTime() {
    return 0;
  }
  generateRecommendations(stats, topErrors) {
    const recommendations = [];
    if (stats.errorsByClassification["configuration" /* CONFIGURATION */] > 5) {
      recommendations.push("Review and validate configuration files");
    }
    if (stats.errorsByClassification["timeout" /* TIMEOUT */] > 3) {
      recommendations.push("Consider increasing timeout values or optimizing performance");
    }
    if (stats.errorsByClassification["resource" /* RESOURCE */] > 2) {
      recommendations.push("Monitor system resources and consider resource optimization");
    }
    if (topErrors.length > 0 && topErrors[0].frequency > 0.3) {
      recommendations.push(`Address recurring error: ${topErrors[0].error.code}`);
    }
    return recommendations;
  }
  analyzeTrends() {
    const trends = {
      increasing: [],
      decreasing: [],
      stable: []
    };
    const recentErrors = this.getRecentErrors(300000);
    const olderErrors = this.getRecentErrors(600000).filter((error) => !recentErrors.includes(error));
    for (const classification of Object.values(ErrorClassification)) {
      const recentCount = recentErrors.filter((e) => e.classification === classification).length;
      const olderCount = olderErrors.filter((e) => e.classification === classification).length;
      if (recentCount > olderCount * 1.2) {
        trends.increasing.push(classification);
      } else if (recentCount < olderCount * 0.8) {
        trends.decreasing.push(classification);
      } else {
        trends.stable.push(classification);
      }
    }
    return trends;
  }
  initializeStats() {
    return {
      totalErrors: 0,
      errorsByClassification: {},
      errorsBySeverity: {},
      errorsByTool: {},
      recoverySuccessRate: 0,
      averageRecoveryTime: 0,
      recentErrors: []
    };
  }
  generateErrorId() {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
// ../../packages/core/src/analysis/graceful-degradation.ts
import { EventEmitter as EventEmitter5 } from "events";
class GracefulDegradationManager extends EventEmitter5 {
  currentLevel = "none" /* NONE */;
  strategies = new Map;
  logger;
  errorHandler;
  healthHistory = [];
  lastLevelChange = null;
  recoveryTimer = null;
  disabledPlugins = new Set;
  originalConfig = {};
  constructor(logger, errorHandler) {
    super();
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.initializeDefaultStrategies();
  }
  updateHealthMetrics(metrics) {
    const fullMetrics = {
      errorRate: 0,
      successRate: 100,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activePlugins: 0,
      queueDepth: 0,
      timestamp: new Date,
      ...metrics
    };
    this.healthHistory.push(fullMetrics);
    const cutoffTime = new Date(Date.now() - 3600000);
    this.healthHistory = this.healthHistory.filter((m) => m.timestamp >= cutoffTime);
    this.checkDegradationTriggers(fullMetrics);
    this.emit("health:updated", fullMetrics);
  }
  forceDegradation(level, reason) {
    if (level === this.currentLevel) {
      return;
    }
    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastLevelChange = new Date;
    this.logger.info(`Forced degradation from ${previousLevel} to ${level}`, { reason });
    this.applyDegradationLevel(level);
    this.emit("degradation:forced", { from: previousLevel, to: level, reason });
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }
  async attemptRecovery() {
    if (this.currentLevel === "none" /* NONE */) {
      return true;
    }
    const strategy = this.strategies.get(this.currentLevel);
    if (!strategy) {
      return false;
    }
    if (this.lastLevelChange) {
      const timeSinceChange = Date.now() - this.lastLevelChange.getTime();
      const cooldownMs = strategy.recovery.cooldownPeriod * 60000;
      if (timeSinceChange < cooldownMs) {
        this.logger.debug(`Recovery cooldown active (${cooldownMs - timeSinceChange}ms remaining)`);
        return false;
      }
    }
    const recentMetrics = this.getRecentMetrics(strategy.recovery.monitoringPeriod * 60000);
    if (!recentMetrics.length) {
      return false;
    }
    const averageSuccessRate = recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length;
    if (averageSuccessRate >= strategy.recovery.successThreshold && averageResponseTime < this.getResponseTimeThreshold(this.currentLevel)) {
      this.logger.info(`Recovery criteria met for ${this.currentLevel} level`);
      return this.recoverToLevel(this.getNextLowerLevel(this.currentLevel));
    }
    this.logger.debug(`Recovery criteria not met: successRate=${averageSuccessRate}%, responseTime=${averageResponseTime}ms`);
    return false;
  }
  getCurrentLevel() {
    return this.currentLevel;
  }
  getHealthHistory(timeWindowMs = 3600000) {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.healthHistory.filter((m) => m.timestamp >= cutoffTime);
  }
  getDisabledPlugins() {
    return Array.from(this.disabledPlugins);
  }
  isPluginDisabled(pluginName) {
    return this.disabledPlugins.has(pluginName);
  }
  addStrategy(level, strategy) {
    this.strategies.set(level, strategy);
    this.logger.debug(`Added degradation strategy for level: ${level}`);
  }
  removeStrategy(level) {
    const removed = this.strategies.delete(level);
    if (removed) {
      this.logger.debug(`Removed degradation strategy for level: ${level}`);
    }
    return removed;
  }
  getStatistics() {
    const timeInCurrentLevel = this.lastLevelChange ? Date.now() - this.lastLevelChange.getTime() : null;
    const healthScore = this.calculateHealthScore();
    const recommendations = this.generateRecommendations();
    return {
      currentLevel: this.currentLevel,
      timeInCurrentLevel,
      totalLevelChanges: this.healthHistory.filter((m) => m.timestamp >= (this.lastLevelChange || new Date(0))).length,
      disabledPluginsCount: this.disabledPlugins.size,
      healthScore,
      recommendations
    };
  }
  initializeDefaultStrategies() {
    this.strategies.set("minimal" /* MINIMAL */, {
      level: "minimal" /* MINIMAL */,
      triggers: {
        errorRate: 5,
        consecutiveErrors: 3,
        memoryUsage: 85,
        cpuUsage: 80,
        responseTime: 1e4
      },
      actions: {
        disablePlugins: [],
        reduceConcurrency: 0.8,
        increaseTimeouts: 1.2,
        enableCaching: true,
        skipExpensiveOperations: false,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 5,
        successThreshold: 95,
        monitoringPeriod: 10
      }
    });
    this.strategies.set("moderate" /* MODERATE */, {
      level: "moderate" /* MODERATE */,
      triggers: {
        errorRate: 10,
        consecutiveErrors: 5,
        memoryUsage: 90,
        cpuUsage: 85,
        responseTime: 20000
      },
      actions: {
        disablePlugins: ["coverage", "complexity"],
        reduceConcurrency: 0.6,
        increaseTimeouts: 1.5,
        enableCaching: true,
        skipExpensiveOperations: true,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 10,
        successThreshold: 90,
        monitoringPeriod: 15
      }
    });
    this.strategies.set("severe" /* SEVERE */, {
      level: "severe" /* SEVERE */,
      triggers: {
        errorRate: 20,
        consecutiveErrors: 10,
        memoryUsage: 95,
        cpuUsage: 90,
        responseTime: 30000
      },
      actions: {
        disablePlugins: ["coverage", "complexity", "style", "security"],
        reduceConcurrency: 0.4,
        increaseTimeouts: 2,
        enableCaching: true,
        skipExpensiveOperations: true,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 15,
        successThreshold: 85,
        monitoringPeriod: 20
      }
    });
    this.strategies.set("critical" /* CRITICAL */, {
      level: "critical" /* CRITICAL */,
      triggers: {
        errorRate: 50,
        consecutiveErrors: 20,
        memoryUsage: 98,
        cpuUsage: 95,
        responseTime: 60000
      },
      actions: {
        disablePlugins: ["coverage", "complexity", "style", "security", "performance"],
        reduceConcurrency: 0.2,
        increaseTimeouts: 3,
        enableCaching: true,
        skipExpensiveOperations: true,
        enableFallbacks: true
      },
      recovery: {
        cooldownPeriod: 30,
        successThreshold: 80,
        monitoringPeriod: 30
      }
    });
  }
  checkDegradationTriggers(metrics) {
    const currentStrategy = this.strategies.get(this.currentLevel);
    const nextLevel = this.getNextLevel(this.currentLevel);
    if (!currentStrategy || !nextLevel) {
      return;
    }
    const nextStrategy = this.strategies.get(nextLevel);
    if (!nextStrategy) {
      return;
    }
    const triggers = nextStrategy.triggers;
    const shouldDegrade = metrics.errorRate > triggers.errorRate || metrics.memoryUsage > triggers.memoryUsage || metrics.cpuUsage > triggers.cpuUsage || metrics.averageResponseTime > triggers.responseTime || this.getConsecutiveErrors() > triggers.consecutiveErrors;
    if (shouldDegrade) {
      this.logger.warn(`Degradation triggers met for level ${nextLevel}`, {
        errorRate: metrics.errorRate,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        responseTime: metrics.averageResponseTime,
        consecutiveErrors: this.getConsecutiveErrors()
      });
      this.degradeToLevel(nextLevel);
    }
  }
  degradeToLevel(level) {
    if (level === this.currentLevel) {
      return;
    }
    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastLevelChange = new Date;
    this.logger.warn(`Degrading from ${previousLevel} to ${level}`);
    this.applyDegradationLevel(level);
    this.emit("degradation:triggered", { from: previousLevel, to: level });
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }
  applyDegradationLevel(level) {
    const strategy = this.strategies.get(level);
    if (!strategy) {
      return;
    }
    const { actions } = strategy;
    for (const pluginName of actions.disablePlugins) {
      this.disabledPlugins.add(pluginName);
      this.logger.debug(`Disabled plugin: ${pluginName}`);
    }
    if (actions.reduceConcurrency < 1) {
      this.emit("config:concurrency:reduced", { factor: actions.reduceConcurrency });
    }
    if (actions.increaseTimeouts > 1) {
      this.emit("config:timeouts:increased", { factor: actions.increaseTimeouts });
    }
    if (actions.enableCaching) {
      this.emit("config:caching:enabled");
    }
    if (actions.skipExpensiveOperations) {
      this.emit("config:expensive-operations:skipped");
    }
    if (actions.enableFallbacks) {
      this.emit("config:fallbacks:enabled");
    }
    this.emit("degradation:applied", { level, actions });
  }
  async recoverToLevel(level) {
    if (level === this.currentLevel) {
      return true;
    }
    this.logger.info(`Attempting recovery from ${this.currentLevel} to ${level}`);
    const previousLevel = this.currentLevel;
    this.currentLevel = level;
    this.lastLevelChange = new Date;
    const higherLevelStrategies = Array.from(this.strategies.entries()).filter(([l]) => this.compareLevels(l, level) > 0);
    for (const [levelName, strategy2] of higherLevelStrategies) {
      for (const pluginName of strategy2.actions.disablePlugins) {
        this.disabledPlugins.delete(pluginName);
        this.logger.debug(`Re-enabled plugin: ${pluginName}`);
      }
    }
    this.applyDegradationLevel(level);
    this.emit("degradation:recovered", { from: previousLevel, to: level });
    const strategy = this.strategies.get(level);
    if (strategy) {
      this.recoveryTimer = setTimeout(() => {
        this.attemptRecovery();
      }, strategy.recovery.cooldownPeriod * 60000);
    }
    return true;
  }
  getNextLevel(currentLevel) {
    const levels = [
      "none" /* NONE */,
      "minimal" /* MINIMAL */,
      "moderate" /* MODERATE */,
      "severe" /* SEVERE */,
      "critical" /* CRITICAL */
    ];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }
  getNextLowerLevel(currentLevel) {
    const levels = [
      "none" /* NONE */,
      "minimal" /* MINIMAL */,
      "moderate" /* MODERATE */,
      "severe" /* SEVERE */,
      "critical" /* CRITICAL */
    ];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex > 0 ? levels[currentIndex - 1] : null;
  }
  compareLevels(level1, level2) {
    const levels = [
      "none" /* NONE */,
      "minimal" /* MINIMAL */,
      "moderate" /* MODERATE */,
      "severe" /* SEVERE */,
      "critical" /* CRITICAL */
    ];
    return levels.indexOf(level1) - levels.indexOf(level2);
  }
  getRecentMetrics(timeWindowMs) {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.healthHistory.filter((m) => m.timestamp >= cutoffTime);
  }
  getResponseTimeThreshold(level) {
    const strategy = this.strategies.get(level);
    return strategy ? strategy.triggers.responseTime : 30000;
  }
  getConsecutiveErrors() {
    const recentErrors = this.errorHandler.getRecentErrors(300000);
    let consecutive = 0;
    const now = new Date;
    const sortedErrors = recentErrors.sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime());
    for (const error of sortedErrors) {
      const timeDiff = now.getTime() - error.context.timestamp.getTime();
      if (timeDiff > 60000)
        break;
      if (consecutive === 0) {
        consecutive = 1;
      } else {
        consecutive++;
      }
    }
    return consecutive;
  }
  calculateHealthScore() {
    if (this.healthHistory.length === 0) {
      return 100;
    }
    const latestMetrics = this.healthHistory[this.healthHistory.length - 1];
    let score = 100;
    score -= Math.min(40, latestMetrics.errorRate * 2);
    score -= Math.max(0, (100 - latestMetrics.successRate) * 0.5);
    score -= Math.max(0, (latestMetrics.memoryUsage - 70) * 0.5);
    score -= Math.max(0, (latestMetrics.cpuUsage - 70) * 0.5);
    score -= Math.max(0, (latestMetrics.averageResponseTime - 5000) / 200);
    const levelPenalties = {
      ["none" /* NONE */]: 0,
      ["minimal" /* MINIMAL */]: 5,
      ["moderate" /* MODERATE */]: 15,
      ["severe" /* SEVERE */]: 30,
      ["critical" /* CRITICAL */]: 50
    };
    score -= levelPenalties[this.currentLevel];
    return Math.max(0, Math.round(score));
  }
  generateRecommendations() {
    const recommendations = [];
    if (this.currentLevel !== "none" /* NONE */) {
      recommendations.push(`System is running in ${this.currentLevel} degradation mode`);
      recommendations.push("Monitor system resources and error rates");
    }
    if (this.disabledPlugins.size > 0) {
      recommendations.push(`${this.disabledPlugins.size} plugins are currently disabled`);
    }
    const latestMetrics = this.healthHistory[this.healthHistory.length - 1];
    if (latestMetrics) {
      if (latestMetrics.memoryUsage > 80) {
        recommendations.push("Memory usage is high - consider freeing up resources");
      }
      if (latestMetrics.cpuUsage > 80) {
        recommendations.push("CPU usage is high - consider reducing concurrent operations");
      }
      if (latestMetrics.errorRate > 5) {
        recommendations.push("Error rate is elevated - review recent errors and logs");
      }
    }
    return recommendations;
  }
}
// ../../packages/core/src/index.ts
var useCoreStore = create((set, get) => ({
  currentProject: null,
  plugins: new Map,
  isLoading: false,
  error: null,
  actions: {
    setProject: (project) => set({ currentProject: project }),
    registerPlugin: (plugin) => {
      const plugins2 = new Map(get().plugins);
      plugins2.set(plugin.name, plugin);
      set({ plugins: plugins2 });
    },
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null })
  }
}));

class PluginManager2 {
  plugins = new Map;
  register(plugin) {
    this.plugins.set(plugin.name, plugin);
  }
  get(name) {
    return this.plugins.get(name);
  }
  list() {
    return Array.from(this.plugins.values());
  }
  async executeAnalysis(toolName, config, options2) {
    const plugin = this.get(toolName);
    if (!plugin) {
      throw new Error(`Plugin '${toolName}' not found`);
    }
    return plugin.analyze(config, options2);
  }
  validateConfiguration(toolName, config) {
    const plugin = this.get(toolName);
    if (!plugin) {
      return false;
    }
    return plugin.validate(config);
  }
}
var pluginManager = new PluginManager2;

// src/commands/setup.ts
import { writeFileSync as writeFileSync2, existsSync as existsSync6 } from "node:fs";

class SetupCommand extends BaseCommand {
  constructor(options2) {
    super(options2);
  }
  get setupOptions() {
    return this.options;
  }
  async execute() {
    this.log("Setting up DevQuality CLI...");
    const configPath = this.options.config ?? ".dev-quality.json";
    if (existsSync6(configPath) && !this.setupOptions.force) {
      this.log("Configuration file already exists. Use --force to overwrite.");
      return;
    }
    const config = await this.createConfiguration();
    if (this.setupOptions.interactive) {
      await this.interactiveSetup();
    }
    this.saveConfiguration(config, configPath);
    this.log("DevQuality CLI setup completed successfully!");
  }
  async createConfiguration() {
    const detectionEngine = new AutoConfigurationDetectionEngine;
    const rootPath = process.cwd();
    try {
      this.log("Auto-detecting project configuration...");
      const detectionResult = await detectionEngine.detectAll(rootPath);
      this.log(`Detected project: ${detectionResult.project.name} (${detectionResult.project.type})`);
      this.log(`Found ${detectionResult.tools.length} tools and ${detectionResult.dependencies.length} dependencies`);
      const tools = detectionResult.tools.map((tool) => ({
        name: tool.name,
        version: tool.version,
        enabled: tool.enabled,
        config: tool.config,
        priority: tool.priority
      }));
      if (tools.length === 0) {
        tools.push(...this.getDefaultTools());
      }
      return {
        name: detectionResult.project.name,
        version: detectionResult.project.version,
        description: detectionResult.project.description,
        type: detectionResult.project.type,
        frameworks: detectionResult.project.frameworks,
        tools,
        paths: {
          source: detectionResult.structure.sourceDirectories[0] ?? "./src",
          tests: detectionResult.structure.testDirectories[0] ?? "./tests",
          config: detectionResult.structure.configDirectories[0] ?? "./configs",
          output: "./output"
        },
        settings: {
          verbose: false,
          quiet: false,
          json: false,
          cache: true
        }
      };
    } catch (error) {
      this.log(`Auto-detection failed: ${error}. Using default configuration.`);
      return this.createDefaultConfiguration();
    }
  }
  createDefaultConfiguration() {
    const packageJsonPath = pathUtils.getConfigPath("package.json");
    let projectName = "my-project";
    let projectVersion = "1.0.0";
    let projectDescription = "A project analyzed by DevQuality";
    let projectType = "backend";
    if (existsSync6(packageJsonPath)) {
      try {
        const packageJson = fileUtils.readJsonSync(packageJsonPath);
        projectName = packageJson.name ?? projectName;
        projectVersion = packageJson.version ?? projectVersion;
        projectDescription = packageJson.description ?? projectDescription;
        if (packageJson.dependencies?.["react"] || packageJson.devDependencies?.["react"]) {
          projectType = "frontend";
        } else if (packageJson.workspaces) {
          projectType = "monorepo";
        }
      } catch (error) {
        this.logVerbose(`Could not read package.json: ${error}`);
      }
    }
    return {
      name: projectName,
      version: projectVersion,
      description: projectDescription,
      type: projectType,
      frameworks: [],
      tools: this.getDefaultTools(),
      paths: {
        source: "./src",
        tests: "./tests",
        config: "./configs",
        output: "./output"
      },
      settings: {
        verbose: false,
        quiet: false,
        json: false,
        cache: true
      }
    };
  }
  getDefaultTools() {
    return [
      {
        name: "typescript",
        version: "5.3.3",
        enabled: true,
        config: {},
        priority: 1
      },
      {
        name: "eslint",
        version: "latest",
        enabled: true,
        config: {},
        priority: 2
      },
      {
        name: "prettier",
        version: "latest",
        enabled: true,
        config: {},
        priority: 3
      }
    ];
  }
  async interactiveSetup() {
    this.log("Interactive setup mode - coming soon!");
    this.log("For now, using default configuration.");
  }
  saveConfiguration(config, configPath) {
    try {
      const content = JSON.stringify(config, null, 2);
      writeFileSync2(configPath, content, "utf-8");
      this.log(`Configuration saved to: ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }
  async loadConfig() {
    const path = this.options.config ?? ".dev-quality.json";
    if (!existsSync6(path)) {
      throw new Error(`Configuration file not found: ${path}`);
    }
    try {
      const config = fileUtils.readJsonSync(path);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}
// src/commands/config.ts
class ConfigCommand extends BaseCommand {
  constructor(options2) {
    super(options2);
  }
  async execute() {
    const configOptions = this.options;
    if (configOptions.show) {
      await this.showConfig();
    } else if (configOptions.edit) {
      await this.editConfig();
    } else if (configOptions.reset) {
      await this.resetConfig();
    } else {
      await this.showConfig();
    }
  }
  async showConfig() {
    try {
      const config = await this.loadConfig();
      this.log("Current configuration:");
      process.stdout.write(this.formatOutput(config));
    } catch {
      this.log(`No configuration found. Run 'dev-quality setup' to create one.`, "warn");
    }
  }
  async editConfig() {
    this.log("Edit configuration - opening in default editor...");
    this.log("This feature will be implemented in a future version.");
  }
  async resetConfig() {
    const configPath = this.options.config ?? ".dev-quality.json";
    this.log("Resetting configuration to defaults...");
    const defaultConfig = {
      name: "my-project",
      version: "1.0.0",
      description: "A project analyzed by DevQuality",
      type: "backend",
      frameworks: [],
      tools: [
        {
          name: "typescript",
          version: "5.3.3",
          enabled: true,
          config: {},
          priority: 1
        },
        {
          name: "eslint",
          version: "latest",
          enabled: true,
          config: {},
          priority: 2
        },
        {
          name: "prettier",
          version: "latest",
          enabled: true,
          config: {},
          priority: 3
        }
      ],
      paths: {
        source: "./src",
        tests: "./tests",
        config: "./configs",
        output: "./output"
      },
      settings: {
        verbose: false,
        quiet: false,
        json: false,
        cache: true
      }
    };
    try {
      fileUtils.writeJsonSync(configPath, defaultConfig);
      this.log(`Configuration reset and saved to: ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to reset configuration: ${error}`);
    }
  }
  async loadConfig() {
    const path = this.options.config ?? ".dev-quality.json";
    try {
      const config = fileUtils.readJsonSync(path);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}

// src/commands/analyze.ts
init_dashboard2();
init_useAnalysisResults();
import React9 from "react";
import { render } from "ink";

class AnalyzeCommand extends BaseCommand {
  constructor(options2) {
    super(options2);
  }
  async execute() {
    const analyzeOptions = this.options;
    const showDashboard = analyzeOptions.dashboard ?? (!analyzeOptions.noDashboard && process.stdout.isTTY);
    if (showDashboard) {
      await this.executeWithDashboard();
    } else {
      await this.executeTraditional();
    }
  }
  async executeWithDashboard() {
    const analyzeOptions = this.options;
    this.log("Starting code quality analysis with dashboard...");
    try {
      const config = await this.loadConfig();
      const DashboardWithAnalysis = () => {
        const { executeAnalysis, analysisError, isAnalyzing } = useAnalysisResults();
        React9.useEffect(() => {
          const projectId = config.name ?? "default-project";
          const plugins2 = analyzeOptions.tools ? analyzeOptions.tools.split(",") : undefined;
          executeAnalysis(projectId, config, {
            plugins: plugins2,
            incremental: !analyzeOptions.quick
          });
        }, []);
        if (analysisError) {
          return React9.createElement("div", {}, [
            React9.createElement("h1", {}, "Analysis Error"),
            React9.createElement("p", {}, analysisError.message)
          ]);
        }
        if (isAnalyzing) {
          return React9.createElement("div", {}, [
            React9.createElement("h1", {}, "Analyzing..."),
            React9.createElement("p", {}, "Please wait while we analyze your code quality.")
          ]);
        }
        return React9.createElement(Dashboard, {
          analysisResult: {
            id: "mock-analysis",
            projectId: config.name ?? "default-project",
            timestamp: new Date().toISOString(),
            duration: 1000,
            overallScore: 85,
            toolResults: [],
            summary: {
              totalIssues: 0,
              totalErrors: 0,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 85,
              toolCount: 0,
              executionTime: 1000
            },
            aiPrompts: []
          }
        });
      };
      const { waitUntilExit } = render(React9.createElement(DashboardWithAnalysis));
      await waitUntilExit();
      this.log("Dashboard analysis completed");
    } catch (error) {
      this.log(`Dashboard analysis failed: ${error instanceof Error ? error.message : error}`, "error");
      throw error;
    }
  }
  async executeTraditional() {
    this.log("Starting code quality analysis...");
    try {
      const config = await this.loadConfig();
      const toolsToRun = this.getToolsToRun(config);
      if (toolsToRun.length === 0) {
        this.log("No tools configured or enabled for analysis.", "warn");
        return;
      }
      this.log(`Running analysis with tools: ${toolsToRun.join(", ")}`);
      const results = [];
      for (const toolName of toolsToRun) {
        this.logVerbose(`Running ${toolName} analysis...`);
        try {
          const result = await this.runToolAnalysis(toolName, config);
          results.push(result);
          const toolSuccess = result.toolResults[0]?.status === "success";
          if (toolSuccess) {
            this.log(`${toolName} analysis completed successfully`);
          } else {
            this.log(`${toolName} analysis failed`, "warn");
          }
        } catch (error) {
          this.log(`${toolName} analysis error: ${error}`, "error");
          results.push({
            id: `${toolName}-error-${Date.now()}`,
            projectId: config.name ?? "default-project",
            timestamp: new Date().toISOString(),
            duration: 0,
            overallScore: 0,
            toolResults: [
              {
                toolName,
                executionTime: 0,
                status: "error",
                issues: [],
                metrics: {
                  issuesCount: 0,
                  errorsCount: 1,
                  warningsCount: 0,
                  infoCount: 0,
                  fixableCount: 0,
                  score: 0
                }
              }
            ],
            summary: {
              totalIssues: 0,
              totalErrors: 1,
              totalWarnings: 0,
              totalFixable: 0,
              overallScore: 0,
              toolCount: 1,
              executionTime: 0
            },
            aiPrompts: []
          });
          if (this.options.failOnError) {
            throw new Error(`Analysis failed for tool: ${toolName}`);
          }
        }
      }
      await this.outputResults(results);
      const summary = this.generateSummary(results);
      this.log(`Analysis completed: ${summary}`);
    } catch (error) {
      this.log(`Analysis failed: ${error instanceof Error ? error.message : error}`, "error");
      throw error;
    }
  }
  getToolsToRun(config) {
    const analyzeOptions = this.options;
    if (analyzeOptions.tools) {
      return analyzeOptions.tools.split(",").map((tool) => tool.trim());
    }
    return config.tools?.filter((tool) => tool.enabled)?.map((tool) => tool.name)?.sort((a, b) => {
      const toolA = config.tools.find((t) => t.name === a);
      const toolB = config.tools.find((t) => t.name === b);
      return (toolA?.priority ?? 999) - (toolB?.priority ?? 999);
    }) ?? [];
  }
  async runToolAnalysis(toolName, config) {
    const startTime = Date.now();
    this.logVerbose(`Simulating ${toolName} analysis...`);
    await new Promise((resolve2) => setTimeout(resolve2, 100 + Math.random() * 200));
    const success = Math.random() > 0.2;
    const result = {
      id: `${toolName}-${Date.now()}`,
      projectId: config.name ?? "default-project",
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      overallScore: success ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30,
      toolResults: [
        {
          toolName,
          executionTime: Date.now() - startTime,
          status: success ? "success" : "error",
          issues: [],
          metrics: {
            issuesCount: success ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10,
            errorsCount: success ? 0 : Math.floor(Math.random() * 5) + 1,
            warningsCount: success ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 10) + 5,
            infoCount: 0,
            fixableCount: Math.floor(Math.random() * 8),
            score: success ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30
          }
        }
      ],
      summary: {
        totalIssues: success ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10,
        totalErrors: success ? 0 : Math.floor(Math.random() * 5) + 1,
        totalWarnings: success ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 10) + 5,
        totalFixable: Math.floor(Math.random() * 8),
        overallScore: success ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 30,
        toolCount: 1,
        executionTime: Date.now() - startTime
      },
      aiPrompts: []
    };
    return result;
  }
  async outputResults(results) {
    const analyzeOptions = this.options;
    if (analyzeOptions.output) {
      const { writeFileSync: writeFileSync4 } = await import("node:fs");
      const content = this.formatOutput(results);
      writeFileSync4(analyzeOptions.output, content, "utf-8");
      this.log(`Results saved to: ${analyzeOptions.output}`);
    } else {
      process.stdout.write(this.formatOutput(results));
    }
  }
  generateSummary(results) {
    const total = results.length;
    const passed = results.filter((r) => r.toolResults[0]?.status === "success").length;
    const failed = total - passed;
    return `${passed}/${total} tools passed, ${failed} failed`;
  }
  async loadConfig() {
    const path = this.options.config ?? ".dev-quality.json";
    try {
      const { readFileSync: readFileSync3 } = await import("node:fs");
      const content = readFileSync3(path, "utf-8");
      const config = JSON.parse(content);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}

// src/commands/report.ts
class ReportCommand extends BaseCommand {
  constructor(options2) {
    super(options2);
  }
  get reportOptions() {
    return this.options;
  }
  async execute() {
    this.log("Generating quality report...");
    try {
      const config = await this.loadConfig();
      const reportType = this.reportOptions.type ?? "summary";
      const reportFormat = this.reportOptions.format ?? "html";
      this.log(`Generating ${reportType} report in ${reportFormat} format...`);
      const reportData = await this.generateReportData(config);
      await this.outputReport(reportData, reportFormat);
      this.log("Report generated successfully!");
    } catch (error) {
      this.log(`Report generation failed: ${error instanceof Error ? error.message : error}`, "error");
      throw error;
    }
  }
  async generateReportData(config) {
    const mockAnalysisResults = [
      {
        tool: "typescript",
        success: true,
        data: { issues: 2, warnings: 1, suggestions: 3 },
        timestamp: new Date().toISOString(),
        duration: 150
      },
      {
        tool: "eslint",
        success: true,
        data: { issues: 5, warnings: 8, suggestions: 12 },
        timestamp: new Date().toISOString(),
        duration: 320
      },
      {
        tool: "prettier",
        success: true,
        data: { issues: 0, warnings: 0, suggestions: 0 },
        timestamp: new Date().toISOString(),
        duration: 80
      }
    ];
    return {
      project: config,
      results: mockAnalysisResults,
      summary: {
        total: mockAnalysisResults.length,
        passed: mockAnalysisResults.filter((r) => r.success).length,
        failed: mockAnalysisResults.filter((r) => !r.success).length,
        warnings: mockAnalysisResults.reduce((sum, r) => sum + r.data.warnings, 0)
      },
      generatedAt: new Date().toISOString()
    };
  }
  async outputReport(reportData, format) {
    let content = "";
    switch (format) {
      case "html":
        content = this.generateHtmlReport(reportData);
        break;
      case "md":
        content = this.generateMarkdownReport(reportData);
        break;
      case "json":
        content = JSON.stringify(reportData, null, 2);
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
    if (this.reportOptions.output) {
      const { writeFileSync: writeFileSync4 } = await import("node:fs");
      writeFileSync4(this.reportOptions.output, content, "utf-8");
      this.log(`Report saved to: ${this.reportOptions.output}`);
    } else {
      process.stdout.write(content);
    }
  }
  generateHtmlReport(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>DevQuality Report - ${data.project.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; }
        .metric .value { font-size: 24px; font-weight: bold; color: #333; }
        .results { margin-top: 20px; }
        .result { margin: 10px 0; padding: 10px; border-left: 4px solid #007acc; background: #f9f9f9; }
        .success { border-color: #28a745; }
        .failed { border-color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>DevQuality Report</h1>
        <p><strong>Project:</strong> ${data.project.name}</p>
        <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tools</h3>
            <div class="value">${data.summary.total}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value" style="color: #28a745;">${data.summary.passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value" style="color: #dc3545;">${data.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Warnings</h3>
            <div class="value" style="color: #ffc107;">${data.summary.warnings}</div>
        </div>
    </div>

    <div class="results">
        <h2>Tool Results</h2>
        ${data.results.map((result) => `
            <div class="result ${result.success ? "success" : "failed"}">
                <h3>${result.tool}</h3>
                <p><strong>Status:</strong> ${result.success ? "✅ Passed" : "❌ Failed"}</p>
                <p><strong>Duration:</strong> ${result.duration}ms</p>
                <p><strong>Issues:</strong> ${result.data.issues}</p>
                <p><strong>Warnings:</strong> ${result.data.warnings}</p>
            </div>
        `).join("")}
    </div>
</body>
</html>`;
  }
  generateMarkdownReport(data) {
    return `# DevQuality Report

## Project: ${data.project.name}

**Generated:** ${new Date(data.generatedAt).toLocaleString()}

## Summary

- **Total Tools:** ${data.summary.total}
- **Passed:** ${data.summary.passed} ✅
- **Failed:** ${data.summary.failed} ❌
- **Warnings:** ${data.summary.warnings} ⚠️

## Tool Results

${data.results.map((result) => `
### ${result.tool}

**Status:** ${result.success ? "✅ Passed" : "❌ Failed"}
**Duration:** ${result.duration}ms
**Issues:** ${result.data.issues}
**Warnings:** ${result.data.warnings}
**Suggestions:** ${result.data.suggestions}
`).join("")}
`;
  }
  async loadConfig() {
    const path = this.options.config ?? ".dev-quality.json";
    try {
      const { readFileSync: readFileSync3 } = await import("node:fs");
      const content = readFileSync3(path, "utf-8");
      const config = JSON.parse(content);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}

// src/components/app.tsx
import React10 from "react";
import { Box as Box13, Text as Text13, useApp as useApp2 } from "ink";
import { jsxDEV as jsxDEV13 } from "react/jsx-dev-runtime";
function App() {
  const { exit } = useApp2();
  React10.useEffect(() => {
    const timer = setTimeout(() => {
      exit();
    }, 5000);
    return () => clearTimeout(timer);
  }, [exit]);
  return /* @__PURE__ */ jsxDEV13(Box13, {
    flexDirection: "column",
    padding: 1,
    children: [
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV13(Text13, {
          bold: true,
          color: "blue",
          children: [
            "DevQuality CLI v",
            version
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV13(Text13, {
          children: "Code Quality Analysis and Reporting Tool"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginBottom: 1,
        children: /* @__PURE__ */ jsxDEV13(Text13, {
          dimColor: true,
          children: "Use 'dev-quality --help' for available commands"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV13(Text13, {
            color: "green",
            children: "✓"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV13(Text13, {
            children: " TypeScript configured"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV13(Text13, {
            color: "green",
            children: "✓"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV13(Text13, {
            children: " Commander.js CLI framework ready"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginBottom: 1,
        children: [
          /* @__PURE__ */ jsxDEV13(Text13, {
            color: "green",
            children: "✓"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV13(Text13, {
            children: " Ink interactive components available"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV13(Box13, {
        marginTop: 1,
        children: /* @__PURE__ */ jsxDEV13(Text13, {
          dimColor: true,
          children: "Starting interactive mode... (auto-exit in 5 seconds)"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/index.ts
var program2 = new Command;
program2.name("dev-quality").description("DevQuality CLI tool for code quality analysis and reporting").version(version, "-v, --version", "Display the version number").helpOption("-h, --help", "Display help for command").allowUnknownOption(false).configureHelp({
  sortSubcommands: true,
  subcommandTerm: (command) => command.name()
});
program2.option("--verbose", "Enable verbose output", false);
program2.option("--quiet", "Suppress all output except errors", false);
program2.option("--json", "Output results as JSON", false);
program2.option("--config <path>", "Path to configuration file", ".dev-quality.json");
program2.option("--no-cache", "Disable caching", false);
program2.command("setup").description("Initialize DevQuality for your project").option("-f, --force", "Force overwrite existing configuration", false).option("-i, --interactive", "Interactive setup mode", true).action(async (options2) => {
  try {
    const setupCommand = new SetupCommand(options2);
    await setupCommand.execute();
  } catch (error) {
    process.stderr.write(`Setup failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("config").description("Manage DevQuality configuration").option("-s, --show", "Show current configuration", false).option("-e, --edit", "Edit configuration", false).option("-r, --reset", "Reset to default configuration", false).action(async (options2) => {
  try {
    const configCommand = new ConfigCommand(options2);
    await configCommand.execute();
  } catch (error) {
    process.stderr.write(`Config command failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("analyze").alias("a").description("Analyze code quality using configured tools").option("-t, --tools <tools>", "Comma-separated list of tools to run").option("-o, --output <path>", "Output file path for results").option("-f, --format <format>", "Output format (json, html, md)", "json").option("--fail-on-error", "Exit with error code on analysis failures", false).option("-d, --dashboard", "Show interactive dashboard", false).option("--no-dashboard", "Disable interactive dashboard").option("--export <format>", "Export results to specified format (json, txt, csv, md, junit)").option("--filter <filter>", "Apply filter to results (e.g., severity:error)").option("--sort-by <field>", "Sort results by field (score, severity, file, tool)").option("--max-items <number>", "Maximum number of items to display").option("--quick", "Quick analysis with minimal output", false).action(async (options2) => {
  try {
    const analyzeCommand = new AnalyzeCommand(options2);
    await analyzeCommand.execute();
  } catch (error) {
    process.stderr.write(`Analysis failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("report").alias("r").description("Generate comprehensive quality reports").option("-t, --type <type>", "Report type (summary, detailed, comparison)", "summary").option("-o, --output <path>", "Output file path for report").option("-f, --format <format>", "Report format (html, md, json)", "html").option("--include-history", "Include historical data in report", false).action(async (options2) => {
  try {
    const reportCommand = new ReportCommand(options2);
    await reportCommand.execute();
  } catch (error) {
    process.stderr.write(`Report generation failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("quick").alias("q").description("Quick analysis with default settings").action(async () => {
  try {
    const analyzeCommand = new AnalyzeCommand({ quick: true });
    await analyzeCommand.execute();
  } catch (error) {
    process.stderr.write(`Quick analysis failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("dashboard").alias("d").description("Launch interactive quality dashboard").option("-i, --input <path>", "Load analysis results from file").option("-t, --tools <tools>", "Comma-separated list of tools to run").option("--filter <filter>", "Apply filter to results (e.g., severity:error)").option("--sort-by <field>", "Sort results by field (score, severity, file, tool)").option("--max-items <number>", "Maximum number of items to display").option("--auto-analyze", "Automatically run analysis on startup", true).action(async (options2) => {
  try {
    const { DashboardCommand: DashboardCommand2 } = await Promise.resolve().then(() => (init_dashboard3(), exports_dashboard));
    const dashboardCommand = new DashboardCommand2(options2);
    await dashboardCommand.execute();
  } catch (error) {
    process.stderr.write(`Dashboard failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("watch").alias("w").description("Watch for changes and run analysis automatically").option("-d, --debounce <ms>", "Debounce time in milliseconds", "1000").option("-i, --interval <ms>", "Check interval in milliseconds", "5000").action(async (options2) => {
  try {
    const { render: render4 } = await import("ink");
    const { WatchComponent: WatchComponent2 } = await Promise.resolve().then(() => (init_watch(), exports_watch));
    render4(React13.createElement(WatchComponent2, options2));
  } catch (error) {
    process.stderr.write(`Watch mode failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("export").description("Export analysis results to various formats").option("-i, --input <path>", "Input file path (JSON results)").option("-o, --output <path>", "Output file path").option("-f, --format <format>", "Export format (csv, xml, pdf)", "csv").action(async (options2) => {
  try {
    const { ExportCommand: ExportCommand2 } = await Promise.resolve().then(() => (init_export(), exports_export));
    const exportCommand = new ExportCommand2(options2);
    await exportCommand.execute();
  } catch (error) {
    process.stderr.write(`Export failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.command("history").description("View analysis history and trends").option("-n, --limit <number>", "Number of history entries to show", "10").option("--plot", "Show trend visualization", false).action(async (options2) => {
  try {
    const { HistoryCommand: HistoryCommand2 } = await Promise.resolve().then(() => (init_history(), exports_history));
    const historyCommand = new HistoryCommand2(options2);
    await historyCommand.execute();
  } catch (error) {
    process.stderr.write(`History command failed: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
});
program2.on("command:*", () => {
  process.stderr.write(`Invalid command: ${program2.args.join(" ")}
See --help for a list of available commands.
`);
  process.exit(1);
});
function startInteractiveMode() {
  render3(React13.createElement(App));
}
export {
  startInteractiveMode,
  program2 as program
};

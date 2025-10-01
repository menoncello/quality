#!/usr/bin/env node
import { createRequire } from 'node:module';
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to =
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, 'default', { value: mod, enumerable: true })
      : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true,
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
      set: newValue => (all[name] = () => newValue),
    });
};
var __esm = (fn, res) => () => (fn && (res = fn((fn = 0))), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/commander/lib/error.js
var require_error = __commonJS(exports => {
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
      super(1, 'commander.invalidArgument', message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS(exports => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || '';
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case '<':
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case '[':
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === '...') {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
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
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
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
    const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');
    return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS(exports => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter(cmd2 => !cmd2._hidden);
      if (cmd._hasImplicitHelpCommand()) {
        const [, helpName, helpArgs] = cmd._helpCommandnameAndArgs.match(/([^ ]+) *(.*)/);
        const helpCommand = cmd.createCommand(helpName).helpOption(false);
        helpCommand.description(cmd._helpCommandDescription);
        if (helpArgs) helpCommand.arguments(helpArgs);
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
      const getSortKey = option => {
        return option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter(option => !option.hidden);
      const showShortHelpFlag =
        cmd._hasHelpOption && cmd._helpShortFlag && !cmd._findOption(cmd._helpShortFlag);
      const showLongHelpFlag = cmd._hasHelpOption && !cmd._findOption(cmd._helpLongFlag);
      if (showShortHelpFlag || showLongHelpFlag) {
        let helpOption;
        if (!showShortHelpFlag) {
          helpOption = cmd.createOption(cmd._helpLongFlag, cmd._helpDescription);
        } else if (!showLongHelpFlag) {
          helpOption = cmd.createOption(cmd._helpShortFlag, cmd._helpDescription);
        } else {
          helpOption = cmd.createOption(cmd._helpFlags, cmd._helpDescription);
        }
        visibleOptions.push(helpOption);
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions) return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter(option => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach(argument => {
          argument.description =
            argument.description || cmd._argsDescription[argument.name()] || '';
        });
      }
      if (cmd.registeredArguments.find(argument => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map(arg => humanReadableArgName(arg)).join(' ');
      return (
        cmd._name +
        (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
        (cmd.options.length ? ' [options]' : '') +
        (args ? ' ' + args : '')
      );
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, helper.subcommandTerm(command).length);
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, helper.argumentTerm(argument).length);
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + '|' + cmd._aliases[0];
      }
      let ancestorCmdNames = '';
      for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + ' ' + cmd.usage();
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
        extraInfo.push(
          `choices: ${option.argChoices.map(choice => JSON.stringify(choice)).join(', ')}`
        );
      }
      if (option.defaultValue !== undefined) {
        const showDefault =
          option.required ||
          option.optional ||
          (option.isBoolean() && typeof option.defaultValue === 'boolean');
        if (showDefault) {
          extraInfo.push(
            `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
          );
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(', ')})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(
          `choices: ${argument.argChoices.map(choice => JSON.stringify(choice)).join(', ')}`
        );
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(
          `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
        );
      }
      if (extraInfo.length > 0) {
        const extraDescripton = `(${extraInfo.join(', ')})`;
        if (argument.description) {
          return `${argument.description} ${extraDescripton}`;
        }
        return extraDescripton;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth || 80;
      const itemIndentWidth = 2;
      const itemSeparatorWidth = 2;
      function formatItem(term, description) {
        if (description) {
          const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
          return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
        }
        return term;
      }
      function formatList(textArray) {
        return textArray
          .join(
            `
`
          )
          .replace(/^/gm, ' '.repeat(itemIndentWidth));
      }
      let output = [`Usage: ${helper.commandUsage(cmd)}`, ''];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([helper.wrap(commandDescription, helpWidth, 0), '']);
      }
      const argumentList = helper.visibleArguments(cmd).map(argument => {
        return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
      });
      if (argumentList.length > 0) {
        output = output.concat(['Arguments:', formatList(argumentList), '']);
      }
      const optionList = helper.visibleOptions(cmd).map(option => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (optionList.length > 0) {
        output = output.concat(['Options:', formatList(optionList), '']);
      }
      if (this.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map(option => {
          return formatItem(helper.optionTerm(option), helper.optionDescription(option));
        });
        if (globalOptionList.length > 0) {
          output = output.concat(['Global Options:', formatList(globalOptionList), '']);
        }
      }
      const commandList = helper.visibleCommands(cmd).map(cmd2 => {
        return formatItem(helper.subcommandTerm(cmd2), helper.subcommandDescription(cmd2));
      });
      if (commandList.length > 0) {
        output = output.concat(['Commands:', formatList(commandList), '']);
      }
      return output.join(`
`);
    }
    padWidth(cmd, helper) {
      return Math.max(
        helper.longestOptionTermLength(cmd, helper),
        helper.longestGlobalOptionTermLength(cmd, helper),
        helper.longestSubcommandTermLength(cmd, helper),
        helper.longestArgumentTermLength(cmd, helper)
      );
    }
    wrap(str, width, indent, minColumnWidth = 40) {
      const indents = ' \\f\\t\\v   -   　\uFEFF';
      const manualIndent = new RegExp(`[\\n][${indents}]+`);
      if (str.match(manualIndent)) return str;
      const columnWidth = width - indent;
      if (columnWidth < minColumnWidth) return str;
      const leadingStr = str.slice(0, indent);
      const columnText = str.slice(indent).replace(
        `\r
`,
        `
`
      );
      const indentString = ' '.repeat(indent);
      const zeroWidthSpace = '​';
      const breaks = `\\s${zeroWidthSpace}`;
      const regex = new RegExp(
        `
|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`,
        'g'
      );
      const lines = columnText.match(regex) || [];
      return (
        leadingStr +
        lines.map((line, i) => {
          if (
            line ===
            `
`
          )
            return '';
          return (i > 0 ? indentString : '') + line.trimEnd();
        }).join(`
`)
      );
    }
  }
  exports.Help = Help;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS(exports => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || '';
      this.required = flags.includes('<');
      this.optional = flags.includes('[');
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith('--no-');
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
      if (typeof impliedOptionValues === 'string') {
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
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(', ')}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, '');
      }
      return this.short.replace(/^-/, '');
    }
    attributeName() {
      return camelcase(this.name().replace(/^no-/, ''));
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map();
      this.negativeOptions = new Map();
      this.dualOptions = new Set();
      options.forEach(option => {
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
      if (!this.dualOptions.has(optionKey)) return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split('-').reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const flagParts = flags.split(/[ |,]+/);
    if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1])) shortFlag = flagParts.shift();
    longFlag = flagParts.shift();
    if (!shortFlag && /^-[^-]$/.test(longFlag)) {
      shortFlag = longFlag;
      longFlag = undefined;
    }
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.splitOptionFlags = splitOptionFlags;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS(exports => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
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
    if (!candidates || candidates.length === 0) return '';
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith('--');
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map(candidate => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach(candidate => {
      if (candidate.length <= 1) return;
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
      similar = similar.map(candidate => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(', ')}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return '';
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS(exports => {
  var EventEmitter = __require('events').EventEmitter;
  var childProcess = __require('child_process');
  var path = __require('path');
  var fs = __require('fs');
  var process2 = __require('process');
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help } = require_help();
  var { Option, splitOptionFlags, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = true;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || '';
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
      this._description = '';
      this._summary = '';
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._outputConfiguration = {
        writeOut: str => process2.stdout.write(str),
        writeErr: str => process2.stderr.write(str),
        getOutHelpWidth: () => (process2.stdout.isTTY ? process2.stdout.columns : undefined),
        getErrHelpWidth: () => (process2.stderr.isTTY ? process2.stderr.columns : undefined),
        outputError: (str, write) => write(str),
      };
      this._hidden = false;
      this._hasHelpOption = true;
      this._helpFlags = '-h, --help';
      this._helpDescription = 'display help for command';
      this._helpShortFlag = '-h';
      this._helpLongFlag = '--help';
      this._addImplicitHelpCommand = undefined;
      this._helpCommandName = 'help';
      this._helpCommandnameAndArgs = 'help [command]';
      this._helpCommandDescription = 'display help for command';
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._hasHelpOption = sourceCommand._hasHelpOption;
      this._helpFlags = sourceCommand._helpFlags;
      this._helpDescription = sourceCommand._helpDescription;
      this._helpShortFlag = sourceCommand._helpShortFlag;
      this._helpLongFlag = sourceCommand._helpLongFlag;
      this._helpCommandName = sourceCommand._helpCommandName;
      this._helpCommandnameAndArgs = sourceCommand._helpCommandnameAndArgs;
      this._helpCommandDescription = sourceCommand._helpCommandDescription;
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
      for (let command = this; command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === 'object' && desc !== null) {
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
      if (opts.isDefault) this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args) cmd.arguments(args);
      this.commands.push(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc) return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help(), this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined) return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined) return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
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
      if (opts.isDefault) this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden) cmd._hidden = true;
      this.commands.push(cmd);
      cmd.parent = this;
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === 'function') {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names
        .trim()
        .split(/ +/)
        .forEach(detail => {
          this.argument(detail);
        });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (
        argument.required &&
        argument.defaultValue !== undefined &&
        argument.parseArg === undefined
      ) {
        throw new Error(
          `a default value for a required argument is never used: '${argument.name()}'`
        );
      }
      this.registeredArguments.push(argument);
      return this;
    }
    addHelpCommand(enableOrNameAndArgs, description) {
      if (enableOrNameAndArgs === false) {
        this._addImplicitHelpCommand = false;
      } else {
        this._addImplicitHelpCommand = true;
        if (typeof enableOrNameAndArgs === 'string') {
          this._helpCommandName = enableOrNameAndArgs.split(' ')[0];
          this._helpCommandnameAndArgs = enableOrNameAndArgs;
        }
        this._helpCommandDescription = description || this._helpCommandDescription;
      }
      return this;
    }
    _hasImplicitHelpCommand() {
      if (this._addImplicitHelpCommand === undefined) {
        return this.commands.length && !this._actionHandler && !this._findCommand('help');
      }
      return this._addImplicitHelpCommand;
    }
    hook(event, listener) {
      const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
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
        this._exitCallback = err => {
          if (err.code !== 'commander.executeSubCommandAsync') {
            throw err;
          } else {
          }
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
      const listener = args => {
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
        if (err.code === 'commander.invalidArgument') {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    addOption(option) {
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, '--');
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(
            name,
            option.defaultValue === undefined ? true : option.defaultValue,
            'default'
          );
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, 'default');
      }
      this.options.push(option);
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = '';
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on('option:' + oname, val => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, 'cli');
      });
      if (option.envVar) {
        this.on('optionEnv:' + oname, val => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, 'env');
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === 'object' && flags instanceof Option) {
        throw new Error(
          'To add an Option object use addOption() instead of option() or requiredOption()'
        );
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === 'function') {
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
      if (!!this.parent && passThrough && !this.parent._enablePositionalOptions) {
        throw new Error(
          'passThroughOptions can not be used without turning on enablePositionalOptions for parent command(s)'
        );
      }
      return this;
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error('call .storeOptionsAsProperties() before adding options');
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
      this._getCommandAndAncestors().forEach(cmd => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error('first parameter to parse must be array or undefined');
      }
      parseOptions = parseOptions || {};
      if (argv === undefined) {
        argv = process2.argv;
        if (process2.versions && process2.versions.electron) {
          parseOptions.from = 'electron';
        }
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case 'node':
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case 'electron':
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case 'user':
          userArgs = argv.slice(0);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
      this._name = this._name || 'program';
      return userArgs;
    }
    parse(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin)) return localBin;
        if (sourceExt.includes(path.extname(baseName))) return;
        const foundExt = sourceExt.find(ext => fs.existsSync(`${localBin}${ext}`));
        if (foundExt) return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || '';
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch (err) {
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
      if (process2.platform !== 'win32') {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: 'inherit' });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
        }
      } else {
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: 'inherit' });
      }
      if (!proc.killed) {
        const signals = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
        signals.forEach(signal => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      if (!exitCallback) {
        proc.on('close', process2.exit.bind(process2));
      } else {
        proc.on('close', () => {
          exitCallback(
            new CommanderError(
              process2.exitCode || 0,
              'commander.executeSubCommandAsync',
              '(close)'
            )
          );
        });
      }
      proc.on('error', err => {
        if (err.code === 'ENOENT') {
          const executableDirMessage = executableDir
            ? `searched for local subcommand relative to directory '${executableDir}'`
            : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
          const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
          throw new Error(executableMissing);
        } else if (err.code === 'EACCES') {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, 'commander.executeSubCommandAsync', '(error)');
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand) this.help({ error: true });
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, 'preSubcommand');
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
      return this._dispatchSubcommand(
        subcommandName,
        [],
        [this._helpLongFlag || this._helpShortFlag]
      );
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (
        this.registeredArguments.length > 0 &&
        this.registeredArguments[this.registeredArguments.length - 1].variadic
      ) {
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
      if (promise && promise.then && typeof promise.then === 'function') {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors()
        .reverse()
        .filter(cmd => cmd._lifeCycleHooks[event] !== undefined)
        .forEach(hookedCommand => {
          hookedCommand._lifeCycleHooks[event].forEach(callback => {
            hooks.push({ hookedCommand, callback });
          });
        });
      if (event === 'postAction') {
        hooks.reverse();
      }
      hooks.forEach(hookDetail => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach(hook => {
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
      if (this._hasImplicitHelpCommand() && operands[0] === this._helpCommandName) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        outputHelpIfRequested(this, unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (
        this.commands.length &&
        this.args.length === 0 &&
        !this._actionHandler &&
        !this._defaultCommandName
      ) {
        this.help({ error: true });
      }
      outputHelpIfRequested(this, parsed.unknown);
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
        promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
        promiseChain = this._chainOrCall(promiseChain, () =>
          this._actionHandler(this.processedArgs)
        );
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand('*')) {
          return this._dispatchSubcommand('*', operands, unknown);
        }
        if (this.listenerCount('command:*')) {
          this.emit('command:*', operands, unknown);
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
      if (!name) return;
      return this.commands.find(cmd => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find(option => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach(cmd => {
        cmd.options.forEach(anOption => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter(option => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== 'default';
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter(
        option => option.conflictsWith.length > 0
      );
      optionsWithConflicting.forEach(option => {
        const conflictingAndDefined = definedNonDefaultOptions.find(defined =>
          option.conflictsWith.includes(defined.attributeName())
        );
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach(cmd => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === '-';
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === '--') {
          if (dest === unknown) dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined) this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf('=');
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if (
          (this._enablePositionalOptions || this._passThroughOptions) &&
          operands.length === 0 &&
          unknown.length === 0
        ) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0) unknown.push(...args);
            break;
          } else if (arg === this._helpCommandName && this._hasImplicitHelpCommand()) {
            operands.push(arg);
            if (args.length > 0) operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0) unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0) dest.push(...args);
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
        for (let i = 0; i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce(
        (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
        {}
      );
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(
        `${message}
`,
        this._outputConfiguration.writeErr
      );
      if (typeof this._showHelpAfterError === 'string') {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || 'commander.error';
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach(option => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (
            this.getOptionValue(optionKey) === undefined ||
            ['default', 'config', 'env'].includes(this.getOptionValueSource(optionKey))
          ) {
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
      const hasCustomOptionValue = optionKey => {
        return (
          this.getOptionValue(optionKey) !== undefined &&
          !['default', 'implied'].includes(this.getOptionValueSource(optionKey))
        );
      };
      this.options
        .filter(
          option =>
            option.implied !== undefined &&
            hasCustomOptionValue(option.attributeName()) &&
            dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)
        )
        .forEach(option => {
          Object.keys(option.implied)
            .filter(impliedKey => !hasCustomOptionValue(impliedKey))
            .forEach(impliedKey => {
              this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
            });
        });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: 'commander.missingArgument' });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: 'commander.optionMissingArgument' });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: 'commander.missingMandatoryOptionValue' });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = option2 => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find(
          target => target.negate && optionKey === target.attributeName()
        );
        const positiveOption = this.options.find(
          target => !target.negate && optionKey === target.attributeName()
        );
        if (
          negativeOption &&
          ((negativeOption.presetArg === undefined && optionValue === false) ||
            (negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg))
        ) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = option2 => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === 'env') {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: 'commander.conflictingOption' });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption) return;
      let suggestion = '';
      if (flag.startsWith('--') && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command
            .createHelp()
            .visibleOptions(command)
            .filter(option => option.long)
            .map(option => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: 'commander.unknownOption' });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments) return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? '' : 's';
      const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: 'commander.excessArguments' });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = '';
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp()
          .visibleCommands(this)
          .forEach(command => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: 'commander.unknownCommand' });
    }
    version(str, flags, description) {
      if (str === undefined) return this._version;
      this._version = str;
      flags = flags || '-V, --version';
      description = description || 'output the version number';
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this.options.push(versionOption);
      this.on('option:' + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, 'commander.version', str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined) return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined) return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined) return this._aliases[0];
      let command = this;
      if (
        this.commands.length !== 0 &&
        this.commands[this.commands.length - 1]._executableHandler
      ) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name) throw new Error("Command alias can't be the same as its name");
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined) return this._aliases;
      aliases.forEach(alias => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage) return this._usage;
        const args = this.registeredArguments.map(arg => {
          return humanReadableArgName(arg);
        });
        return []
          .concat(
            this.options.length || this._hasHelpOption ? '[options]' : [],
            this.commands.length ? '[command]' : [],
            this.registeredArguments.length ? args : []
          )
          .join(' ');
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined) return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined) return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      if (helper.helpWidth === undefined) {
        helper.helpWidth =
          contextOptions && contextOptions.error
            ? this._outputConfiguration.getErrHelpWidth()
            : this._outputConfiguration.getOutHelpWidth();
      }
      return helper.formatHelp(this, helper);
    }
    _getHelpContext(contextOptions) {
      contextOptions = contextOptions || {};
      const context = { error: !!contextOptions.error };
      let write;
      if (context.error) {
        write = arg => this._outputConfiguration.writeErr(arg);
      } else {
        write = arg => this._outputConfiguration.writeOut(arg);
      }
      context.write = contextOptions.write || write;
      context.command = this;
      return context;
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === 'function') {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const context = this._getHelpContext(contextOptions);
      this._getCommandAndAncestors()
        .reverse()
        .forEach(command => command.emit('beforeAllHelp', context));
      this.emit('beforeHelp', context);
      let helpInformation = this.helpInformation(context);
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== 'string' && !Buffer.isBuffer(helpInformation)) {
          throw new Error('outputHelp callback must return a string or a Buffer');
        }
      }
      context.write(helpInformation);
      if (this._helpLongFlag) {
        this.emit(this._helpLongFlag);
      }
      this.emit('afterHelp', context);
      this._getCommandAndAncestors().forEach(command => command.emit('afterAllHelp', context));
    }
    helpOption(flags, description) {
      if (typeof flags === 'boolean') {
        this._hasHelpOption = flags;
        return this;
      }
      this._helpFlags = flags || this._helpFlags;
      this._helpDescription = description || this._helpDescription;
      const helpFlags = splitOptionFlags(this._helpFlags);
      this._helpShortFlag = helpFlags.shortFlag;
      this._helpLongFlag = helpFlags.longFlag;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = process2.exitCode || 0;
      if (
        exitCode === 0 &&
        contextOptions &&
        typeof contextOptions !== 'function' &&
        contextOptions.error
      ) {
        exitCode = 1;
      }
      this._exit(exitCode, 'commander.help', '(outputHelp)');
    }
    addHelpText(position, text) {
      const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, context => {
        let helpStr;
        if (typeof text === 'function') {
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
  }
  function outputHelpIfRequested(cmd, args) {
    const helpOption =
      cmd._hasHelpOption &&
      args.find(arg => arg === cmd._helpLongFlag || arg === cmd._helpShortFlag);
    if (helpOption) {
      cmd.outputHelp();
      cmd._exit(0, 'commander.helpDisplayed', '(outputHelp)');
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map(arg => {
      if (!arg.startsWith('--inspect')) {
        return arg;
      }
      let debugOption;
      let debugHost = '127.0.0.1';
      let debugPort = '9229';
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
      if (debugOption && debugPort !== '0') {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  exports.Command = Command;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports, module) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports = module.exports = new Command();
  exports.program = exports;
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
  constructor(options) {
    this.options = options;
  }
  async loadConfig() {
    throw new Error('loadConfig must be implemented by subclass');
  }
  log(message, level = 'info') {
    if (this.options.quiet && level !== 'error') {
      return;
    }
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARN' : 'INFO';
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

// ../../node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js
import * as React from 'react';
var require_use_sync_external_store_shim_development = __commonJS(exports => {
  (function () {
    function is(x, y) {
      return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
    }
    function useSyncExternalStore$2(subscribe, getSnapshot) {
      didWarnOld18Alpha ||
        React.startTransition === undefined ||
        ((didWarnOld18Alpha = true),
        console.error(
          'You are using an outdated, pre-release alpha of React 18 that does not support useSyncExternalStore. The use-sync-external-store shim will not work correctly. Upgrade to a newer pre-release.'
        ));
      var value = getSnapshot();
      if (!didWarnUncachedGetSnapshot) {
        var cachedValue = getSnapshot();
        objectIs(value, cachedValue) ||
          (console.error('The result of getSnapshot should be cached to avoid an infinite loop'),
          (didWarnUncachedGetSnapshot = true));
      }
      cachedValue = useState2({
        inst: { value, getSnapshot },
      });
      var inst = cachedValue[0].inst,
        forceUpdate = cachedValue[1];
      useLayoutEffect2(
        function () {
          inst.value = value;
          inst.getSnapshot = getSnapshot;
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
        },
        [subscribe, value, getSnapshot]
      );
      useEffect2(
        function () {
          checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          return subscribe(function () {
            checkIfSnapshotChanged(inst) && forceUpdate({ inst });
          });
        },
        [subscribe]
      );
      useDebugValue2(value);
      return value;
    }
    function checkIfSnapshotChanged(inst) {
      var latestGetSnapshot = inst.getSnapshot;
      inst = inst.value;
      try {
        var nextValue = latestGetSnapshot();
        return !objectIs(inst, nextValue);
      } catch (error) {
        return true;
      }
    }
    function useSyncExternalStore$1(subscribe, getSnapshot) {
      return getSnapshot();
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === 'function' &&
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var objectIs = typeof Object.is === 'function' ? Object.is : is,
      useState2 = React.useState,
      useEffect2 = React.useEffect,
      useLayoutEffect2 = React.useLayoutEffect,
      useDebugValue2 = React.useDebugValue,
      didWarnOld18Alpha = false,
      didWarnUncachedGetSnapshot = false,
      shim =
        typeof window === 'undefined' ||
        typeof window.document === 'undefined' ||
        typeof window.document.createElement === 'undefined'
          ? useSyncExternalStore$1
          : useSyncExternalStore$2;
    exports.useSyncExternalStore =
      React.useSyncExternalStore !== undefined ? React.useSyncExternalStore : shim;
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === 'function' &&
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  })();
});

// ../../node_modules/use-sync-external-store/shim/index.js
var require_shim = __commonJS((exports, module) => {
  if (false) {
  } else {
    module.exports = require_use_sync_external_store_shim_development();
  }
});

// ../../node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.development.js
import * as React2 from 'react';
var require_with_selector_development = __commonJS(exports => {
  (function () {
    function is(x, y) {
      return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
    }
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart === 'function' &&
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
    var shim = require_shim(),
      objectIs = typeof Object.is === 'function' ? Object.is : is,
      useSyncExternalStore = shim.useSyncExternalStore,
      useRef2 = React2.useRef,
      useEffect2 = React2.useEffect,
      useMemo2 = React2.useMemo,
      useDebugValue2 = React2.useDebugValue;
    exports.useSyncExternalStoreWithSelector = function (
      subscribe,
      getSnapshot,
      getServerSnapshot,
      selector,
      isEqual
    ) {
      var instRef = useRef2(null);
      if (instRef.current === null) {
        var inst = { hasValue: false, value: null };
        instRef.current = inst;
      } else inst = instRef.current;
      instRef = useMemo2(
        function () {
          function memoizedSelector(nextSnapshot) {
            if (!hasMemo) {
              hasMemo = true;
              memoizedSnapshot = nextSnapshot;
              nextSnapshot = selector(nextSnapshot);
              if (isEqual !== undefined && inst.hasValue) {
                var currentSelection = inst.value;
                if (isEqual(currentSelection, nextSnapshot))
                  return (memoizedSelection = currentSelection);
              }
              return (memoizedSelection = nextSnapshot);
            }
            currentSelection = memoizedSelection;
            if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
            var nextSelection = selector(nextSnapshot);
            if (isEqual !== undefined && isEqual(currentSelection, nextSelection))
              return ((memoizedSnapshot = nextSnapshot), currentSelection);
            memoizedSnapshot = nextSnapshot;
            return (memoizedSelection = nextSelection);
          }
          var hasMemo = false,
            memoizedSnapshot,
            memoizedSelection,
            maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot;
          return [
            function () {
              return memoizedSelector(getSnapshot());
            },
            maybeGetServerSnapshot === null
              ? undefined
              : function () {
                  return memoizedSelector(maybeGetServerSnapshot());
                },
          ];
        },
        [getSnapshot, getServerSnapshot, selector, isEqual]
      );
      var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
      useEffect2(
        function () {
          inst.hasValue = true;
          inst.value = value;
        },
        [value]
      );
      useDebugValue2(value);
      return value;
    };
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop === 'function' &&
      __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
  })();
});

// ../../node_modules/use-sync-external-store/shim/with-selector.js
var require_with_selector = __commonJS((exports, module) => {
  if (false) {
  } else {
    module.exports = require_with_selector_development();
  }
});

// src/components/watch.tsx
var exports_watch = {};
__export(exports_watch, {
  WatchComponent: () => WatchComponent,
});
import { useState, useEffect } from 'react';
import { Box as Box2, Text as Text2, useApp as useApp2 } from 'ink';
import { jsxDEV as jsxDEV2 } from 'react/jsx-dev-runtime';
function WatchComponent(props) {
  const { exit } = useApp2();
  const [isRunning, setIsRunning] = useState(true);
  const [lastRun, setLastRun] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = parseInt(props.interval ?? '5000');
    const interval = setInterval(() => {
      setLastRun(new Date());
      setAnalysisCount(prev => prev + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isRunning, props.interval]);
  useEffect(() => {
    const handleKeyPress = data => {
      if (data === 'q') {
        setIsRunning(false);
        exit();
      }
    };
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', handleKeyPress);
    return () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off('data', handleKeyPress);
    };
  }, [exit]);
  return /* @__PURE__ */ jsxDEV2(
    Box2,
    {
      flexDirection: 'column',
      padding: 1,
      children: [
        /* @__PURE__ */ jsxDEV2(
          Box2,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV2(
              Text2,
              {
                bold: true,
                color: 'blue',
                children: 'DevQuality Watch Mode',
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV2(
          Box2,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV2(
              Text2,
              {
                children: 'Monitoring for changes...',
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV2(
          Box2,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV2(
              Text2,
              {
                dimColor: true,
                children: "Press 'q' to quit",
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV2(
          Box2,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV2(
              Text2,
              {
                color: 'green',
                children: ['Status: ', isRunning ? 'Running' : 'Stopped'],
              },
              undefined,
              true,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        lastRun &&
          /* @__PURE__ */ jsxDEV2(
            Box2,
            {
              marginBottom: 1,
              children: /* @__PURE__ */ jsxDEV2(
                Text2,
                {
                  children: ['Last run: ', lastRun.toLocaleTimeString()],
                },
                undefined,
                true,
                undefined,
                this
              ),
            },
            undefined,
            false,
            undefined,
            this
          ),
        /* @__PURE__ */ jsxDEV2(
          Box2,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV2(
              Text2,
              {
                children: ['Analyses completed: ', analysisCount],
              },
              undefined,
              true,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV2(
          Box2,
          {
            marginTop: 1,
            children: /* @__PURE__ */ jsxDEV2(
              Text2,
              {
                dimColor: true,
                children: [
                  'Interval: ',
                  props.interval ?? '5000',
                  'ms | Debounce: ',
                  props.debounce ?? '1000',
                  'ms',
                ],
              },
              undefined,
              true,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
      ],
    },
    undefined,
    true,
    undefined,
    this
  );
}
var init_watch = () => {};

// src/commands/export.ts
var exports_export = {};
__export(exports_export, {
  ExportCommand: () => ExportCommand,
});
var ExportCommand;
var init_export = __esm(() => {
  ExportCommand = class ExportCommand extends BaseCommand {
    constructor(options) {
      super(options);
    }
    async execute() {
      this.log('Export functionality will be implemented in a future version.');
    }
    async loadConfig() {
      throw new Error('Export command does not load configuration');
    }
  };
});

// src/commands/history.ts
var exports_history = {};
__export(exports_history, {
  HistoryCommand: () => HistoryCommand,
});
var HistoryCommand;
var init_history = __esm(() => {
  HistoryCommand = class HistoryCommand extends BaseCommand {
    constructor(options) {
      super(options);
    }
    async execute() {
      this.log('History functionality will be implemented in a future version.');
    }
    async loadConfig() {
      throw new Error('History command does not load configuration');
    }
  };
});

// node_modules/commander/esm.mjs
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
  Help,
} = import__.default;

// src/index.ts
import { render } from 'ink';
import React5 from 'react';
// package.json
var version = '0.0.0';
// ../../packages/core/node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = createState => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== 'object' || nextState === null)
        ? nextState
        : Object.assign({}, state, nextState);
      listeners.forEach(listener => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((import.meta.env ? import.meta.env.MODE : undefined) !== 'production') {
      console.warn(
        '[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected.'
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = (state = createState(setState, getState, api));
  return api;
};
var createStore = createState => (createState ? createStoreImpl(createState) : createStoreImpl);

// ../../packages/core/node_modules/zustand/esm/index.mjs
var import_with_selector = __toESM(require_with_selector(), 1);
import ReactExports from 'react';
var { useDebugValue } = ReactExports;
var { useSyncExternalStoreWithSelector } = import_with_selector.default;
var didWarnAboutEqualityFn = false;
var identity = arg => arg;
function useStore(api, selector = identity, equalityFn) {
  if (
    (import.meta.env ? import.meta.env.MODE : undefined) !== 'production' &&
    equalityFn &&
    !didWarnAboutEqualityFn
  ) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
var createImpl = createState => {
  if (
    (import.meta.env ? import.meta.env.MODE : undefined) !== 'production' &&
    typeof createState !== 'function'
  ) {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === 'function' ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
var create = createState => (createState ? createImpl(createState) : createImpl);

// ../../packages/core/src/detection/project-detector.ts
import { existsSync as existsSync2 } from 'node:fs';
import { join as join2 } from 'node:path';

// ../../packages/utils/src/index.ts
import { join, dirname, basename, extname, relative } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
var pathUtils = {
  join,
  dirname,
  basename,
  extname,
  relative,
  getAppDataPath: appName => {
    const platform = process.platform;
    const home = homedir();
    if (platform === 'darwin') {
      return join(home, 'Library', 'Application Support', appName);
    }
    if (platform === 'win32') {
      return join(home, 'AppData', 'Roaming', appName);
    }
    return join(home, '.local', 'share', appName);
  },
  ensureDir: dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },
  getConfigPath: configName => {
    return join(process.cwd(), configName);
  },
};
var fileUtils = {
  readJsonSync: filePath => {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  },
  writeJsonSync: (filePath, data) => {
    const content = JSON.stringify(data, null, 2);
    writeFileSync(filePath, content, 'utf-8');
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
  },
};

// ../../packages/core/src/detection/project-detector.ts
class ProjectDetector {
  FRAMEWORK_PATTERNS = {
    react: ['react', 'react-dom', '@types/react', 'next', 'gatsby', 'remix'],
    vue: ['vue', 'nuxt', '@nuxt/core', 'quasar'],
    angular: ['@angular/core', '@angular/common', '@angular/platform-browser'],
    svelte: ['svelte', 'svelte-kit'],
    node: ['express', 'fastify', 'koa', 'nestjs', 'hapi'],
  };
  BUILD_SYSTEMS = [
    { name: 'vite', files: ['vite.config.ts', 'vite.config.js'] },
    { name: 'webpack', files: ['webpack.config.js', 'webpack.config.ts'] },
    { name: 'rollup', files: ['rollup.config.js', 'rollup.config.ts'] },
    { name: 'next', files: ['next.config.js', 'next.config.ts'] },
    { name: 'nuxt', files: ['nuxt.config.ts', 'nuxt.config.js'] },
    { name: 'angular', files: ['angular.json'] },
    { name: 'parcel', files: ['.parcelrc'] },
  ];
  async detectProject(rootPath) {
    const packageJsonPath = join2(rootPath, 'package.json');
    if (!existsSync2(packageJsonPath)) {
      throw new Error('No package.json found in project root');
    }
    const packageJson = this.parsePackageJson(packageJsonPath);
    const projectType = this.determineProjectType(packageJson, rootPath);
    const frameworks = this.detectFrameworks(packageJson);
    const buildSystems = this.detectBuildSystems(rootPath);
    const packageManager = this.detectPackageManager(rootPath);
    const hasTypeScript = this.hasTypeScript(packageJson, rootPath);
    const hasTests = this.hasTests(packageJson, rootPath);
    return {
      name: packageJson.name || 'unknown-project',
      version: packageJson.version || '1.0.0',
      description: packageJson.description || '',
      type: projectType,
      frameworks,
      buildSystems,
      packageManager,
      hasTypeScript,
      hasTests,
      isMonorepo: projectType === 'monorepo',
      root: rootPath,
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
      return 'monorepo';
    }
    const frontendFrameworks = ['react', 'vue', 'angular', 'svelte'];
    const hasFrontendDeps = frontendFrameworks.some(framework =>
      depNames.some(dep => dep.includes(framework))
    );
    const backendFrameworks = ['express', 'fastify', 'koa', 'nestjs', 'hapi'];
    const hasBackendDeps = backendFrameworks.some(framework =>
      depNames.some(dep => dep.includes(framework))
    );
    if (hasFrontendDeps && hasBackendDeps) {
      return 'fullstack';
    } else if (hasFrontendDeps) {
      return 'frontend';
    } else {
      return 'backend';
    }
  }
  detectFrameworks(packageJson) {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depNames = Object.keys(dependencies);
    const frameworks = [];
    for (const [framework, patterns] of Object.entries(this.FRAMEWORK_PATTERNS)) {
      if (patterns.some(pattern => depNames.some(dep => dep.includes(pattern)))) {
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
    if (existsSync2(join2(rootPath, 'bun.lockb'))) {
      return 'bun';
    }
    if (existsSync2(join2(rootPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync2(join2(rootPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }
  hasTypeScript(packageJson, rootPath) {
    const hasTypeScriptDep = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).some(dep => dep === 'typescript' || dep.startsWith('@types/'));
    const hasTsConfig =
      existsSync2(join2(rootPath, 'tsconfig.json')) ||
      existsSync2(join2(rootPath, 'jsconfig.json'));
    return hasTypeScriptDep || hasTsConfig;
  }
  hasTests(packageJson, rootPath) {
    const testScripts = packageJson.scripts
      ? Object.keys(packageJson.scripts).filter(key => key.includes('test') || key.includes('spec'))
      : [];
    const testDeps = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).filter(
      dep =>
        dep.includes('jest') ||
        dep.includes('vitest') ||
        dep.includes('mocha') ||
        dep.includes('cypress') ||
        dep.includes('playwright') ||
        dep.includes('test') ||
        dep.includes('bun-test')
    );
    const hasTestDir =
      existsSync2(join2(rootPath, 'test')) ||
      existsSync2(join2(rootPath, 'tests')) ||
      existsSync2(join2(rootPath, '__tests__'));
    return testScripts.length > 0 || testDeps.length > 0 || hasTestDir;
  }
  hasMonorepoConfig(rootPath) {
    const monorepoFiles = [
      'pnpm-workspace.yaml',
      'nx.json',
      'turbo.json',
      'lerna.json',
      'rush.json',
    ];
    return monorepoFiles.some(file => existsSync2(join2(rootPath, file)));
  }
}

// ../../packages/core/src/detection/tool-detector.ts
import { existsSync as existsSync3 } from 'node:fs';
import { join as join3, basename as basename2, extname as extname2 } from 'node:path';
class ToolDetector {
  TOOL_CONFIGS = [
    {
      tool: 'eslint',
      configs: [
        '.eslintrc',
        '.eslintrc.json',
        '.eslintrc.yaml',
        '.eslintrc.yml',
        '.eslintrc.js',
        'eslint.config.js',
      ],
      versionDep: 'eslint',
    },
    {
      tool: 'prettier',
      configs: [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yaml',
        '.prettierrc.yml',
        '.prettierrc.js',
        '.prettierrc.toml',
      ],
      versionDep: 'prettier',
    },
    {
      tool: 'typescript',
      configs: ['tsconfig.json', 'jsconfig.json'],
      versionDep: 'typescript',
    },
    {
      tool: 'jest',
      configs: [
        'jest.config.js',
        'jest.config.ts',
        'jest.config.json',
        'jest.config.mjs',
        'jest.config.cjs',
      ],
      versionDep: 'jest',
    },
    {
      tool: 'vitest',
      configs: ['vitest.config.ts', 'vitest.config.js', 'vitest.workspace.ts'],
      versionDep: 'vitest',
    },
    {
      tool: 'cypress',
      configs: ['cypress.config.js', 'cypress.config.ts'],
      versionDep: 'cypress',
    },
    {
      tool: 'playwright',
      configs: ['playwright.config.js', 'playwright.config.ts'],
      versionDep: '@playwright/test',
    },
    {
      tool: 'webpack',
      configs: [
        'webpack.config.js',
        'webpack.config.ts',
        'webpack.config.mjs',
        'webpack.config.cjs',
      ],
      versionDep: 'webpack',
    },
    {
      tool: 'vite',
      configs: ['vite.config.js', 'vite.config.ts'],
      versionDep: 'vite',
    },
    {
      tool: 'rollup',
      configs: ['rollup.config.js', 'rollup.config.ts'],
      versionDep: 'rollup',
    },
    {
      tool: 'next',
      configs: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
      versionDep: 'next',
    },
    {
      tool: 'nuxt',
      configs: ['nuxt.config.ts', 'nuxt.config.js'],
      versionDep: 'nuxt',
    },
    {
      tool: 'tailwind',
      configs: ['tailwind.config.js', 'tailwind.config.ts'],
      versionDep: 'tailwindcss',
    },
    {
      tool: 'postcss',
      configs: ['postcss.config.js', 'postcss.config.ts', 'postcss.config.mjs'],
      versionDep: 'postcss',
    },
    {
      tool: 'babel',
      configs: ['babel.config.js', 'babel.config.json', '.babelrc', '.babelrc.js'],
      versionDep: '@babel/core',
    },
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
              config: configContent,
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
        version: version2 || 'unknown',
        configPath,
        configFormat: this.getConfigFormat(basename2(configPath)),
        enabled: true,
        priority: this.getToolPriority(toolConfig.tool),
        config: configContent,
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
      case 'json':
        return fileUtils.readJsonSync(configPath);
      case 'js':
      case 'ts':
        return { _type: format, _path: configPath };
      case 'yaml':
        return { _type: format, _path: configPath };
      default:
        return { _type: 'unknown', _path: configPath };
    }
  }
  getConfigFormat(filename) {
    const ext = extname2(filename).toLowerCase();
    switch (ext) {
      case '.json':
        return 'json';
      case '.js':
        return 'js';
      case '.ts':
        return 'ts';
      case '.yaml':
      case '.yml':
        return 'yaml';
      default:
        if (filename.endsWith('.json')) return 'json';
        if (filename.endsWith('.js')) return 'js';
        if (filename.endsWith('.ts')) return 'ts';
        if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml';
        return 'json';
    }
  }
  extractVersion(packageJson, depName) {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies,
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
      playwright: 9,
    };
    return priorities[toolName] || 99;
  }
  loadPackageJson(rootPath) {
    const packageJsonPath = join3(rootPath, 'package.json');
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
      minimum: '4.9.0',
      recommended: '5.3.3',
      incompatible: ['<4.9.0'],
    },
    eslint: {
      minimum: '8.0.0',
      recommended: '8.57.0',
      incompatible: ['<8.0.0'],
    },
    prettier: {
      minimum: '2.0.0',
      recommended: '3.0.0',
      incompatible: ['<2.0.0'],
    },
    jest: {
      minimum: '29.0.0',
      recommended: '29.7.0',
      incompatible: ['<29.0.0'],
    },
    vitest: {
      minimum: '0.34.0',
      recommended: '1.0.0',
      incompatible: ['<0.34.0'],
    },
    webpack: {
      minimum: '5.0.0',
      recommended: '5.89.0',
      incompatible: ['<5.0.0'],
    },
    vite: {
      minimum: '4.0.0',
      recommended: '5.0.0',
      incompatible: ['<4.0.0'],
    },
    react: {
      minimum: '16.8.0',
      recommended: '18.2.0',
      incompatible: ['<16.8.0'],
    },
    next: {
      minimum: '13.0.0',
      recommended: '14.0.0',
      incompatible: ['<13.0.0'],
    },
  };
  VERSION_CONFLICTS = {
    'typescript@<4.9.0': ['next@>=13.0.0', 'react@>=18.0.0'],
    'typescript@>=5.0.0': ['some-old-framework@<2.0.0'],
    'react@<16.8.0': ['react-hooks@>=1.0.0'],
    'react@>=18.0.0': ['some-old-library@<1.0.0'],
    'webpack@<5.0.0': ['webpack-dev-server@>=4.0.0'],
    'vite@<3.0.0': ['@vitejs/plugin-react@>=2.0.0'],
  };
  async detectDependencies(rootPath) {
    const packageJson = this.loadPackageJson(rootPath);
    const dependencies = [];
    const depTypeMap = {
      dependencies: 'dependency',
      devDependencies: 'devDependency',
      peerDependencies: 'peerDependency',
      optionalDependencies: 'devDependency',
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
            issues,
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
      if (dep.compatibility === 'incompatible') {
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
      recommendations: [...new Set(recommendations)],
    };
  }
  getMinimumVersion(tool) {
    return this.COMPATIBILITY_MATRIX[tool]?.minimum || '0.0.0';
  }
  getRecommendedVersion(tool) {
    return this.COMPATIBILITY_MATRIX[tool]?.recommended || 'latest';
  }
  checkDependencyCompatibility(name, version2) {
    const matrix = this.COMPATIBILITY_MATRIX[name];
    if (!matrix) {
      return 'unknown';
    }
    const cleanVersion = this.cleanVersion(version2);
    const minVersion = matrix.minimum;
    const incompatibleVersions = matrix.incompatible || [];
    for (const incompatible of incompatibleVersions) {
      if (this.satisfiesVersion(cleanVersion, incompatible)) {
        return 'incompatible';
      }
    }
    if (this.compareVersions(cleanVersion, minVersion) < 0) {
      return 'incompatible';
    }
    return 'compatible';
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
    const depMap = new Map(deps.map(d => [d.name, d.version]));
    for (const [conflictPattern, conflictingDeps] of Object.entries(this.VERSION_CONFLICTS)) {
      const [depName, versionRange] = conflictPattern.split('@');
      if (!depName || !versionRange) continue;
      const currentDep = depMap.get(depName);
      if (currentDep && this.satisfiesVersion(currentDep, versionRange)) {
        for (const conflictingDep of conflictingDeps) {
          const [conflictingName, conflictingRange] = conflictingDep.split('@');
          if (!conflictingName || !conflictingRange) continue;
          const conflictingVersion = depMap.get(conflictingName);
          if (conflictingVersion && this.satisfiesVersion(conflictingVersion, conflictingRange)) {
            conflicts.push(
              `Version conflict: ${depName}@${currentDep} conflicts with ${conflictingName}@${conflictingVersion}`
            );
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
      if (matrix && dep.compatibility === 'incompatible') {
        const recommended = matrix.recommended;
        recommendations.push(`Upgrade ${dep.name} from ${dep.version} to ${recommended}`);
      }
    }
    return recommendations;
  }
  cleanVersion(version2) {
    return (
      version2
        .replace(/^[\^~]/, '')
        .replace(/-.*$/, '')
        .split(' ')[0] || '0.0.0'
    );
  }
  compareVersions(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }
  satisfiesVersion(version2, range) {
    const cleanVersion = this.cleanVersion(version2);
    if (range.startsWith('>=')) {
      return this.compareVersions(cleanVersion, range.substring(2)) >= 0;
    } else if (range.startsWith('>')) {
      return this.compareVersions(cleanVersion, range.substring(1)) > 0;
    } else if (range.startsWith('<=')) {
      return this.compareVersions(cleanVersion, range.substring(2)) <= 0;
    } else if (range.startsWith('<')) {
      return this.compareVersions(cleanVersion, range.substring(1)) < 0;
    } else if (range.includes('-')) {
      const [min, max] = range.split('-');
      if (!min || !max) return false;
      return (
        this.compareVersions(cleanVersion, min) >= 0 && this.compareVersions(cleanVersion, max) <= 0
      );
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
import { existsSync as existsSync4, readdirSync, readFileSync as readFileSync2 } from 'node:fs';
import { join as join4, relative as relative2 } from 'node:path';
class StructureAnalyzer {
  MONOREPO_PATTERNS = {
    npm: ['package.json', 'workspaces'],
    yarn: ['package.json', 'workspaces'],
    pnpm: ['pnpm-workspace.yaml'],
    nx: ['nx.json'],
    turbo: ['turbo.json'],
    lerna: ['lerna.json'],
    rush: ['rush.json'],
  };
  SOURCE_PATTERNS = [
    'src',
    'lib',
    'source',
    'app',
    'components',
    'pages',
    'views',
    'services',
    'utils',
    'helpers',
    'hooks',
    'types',
    'interfaces',
  ];
  TEST_PATTERNS = ['test', 'tests', '__tests__', 'spec', 'specs', 'e2e', 'integration', 'unit'];
  CONFIG_PATTERNS = ['config', 'configs', '.config', 'configuration', 'conf'];
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
      complexity: 'simple',
    };
    structure.complexity = this.calculateComplexity(structure);
    return structure;
  }
  async detectMonorepoType(rootPath) {
    for (const [type, patterns] of Object.entries(this.MONOREPO_PATTERNS)) {
      if (type === 'npm' || type === 'yarn') continue;
      for (const pattern of patterns) {
        if (existsSync4(join4(rootPath, pattern))) {
          return type;
        }
      }
    }
    const packageJsonPath = join4(rootPath, 'package.json');
    if (existsSync4(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync(packageJsonPath);
        if (pkgJson.workspaces) {
          const packageManager = this.detectPackageManager(rootPath);
          return packageManager === 'yarn' ? 'yarn' : 'npm';
        }
      } catch (error) {
        console.warn('Failed to read package.json for monorepo type detection:', error);
      }
    }
    return null;
  }
  detectMonorepo(rootPath) {
    const packageJsonPath = join4(rootPath, 'package.json');
    if (existsSync4(packageJsonPath)) {
      try {
        const pkgJson = fileUtils.readJsonSync(packageJsonPath);
        if (pkgJson.workspaces) {
          return true;
        }
      } catch (error) {
        console.warn('Failed to read package.json:', error);
      }
    }
    const monorepoFiles = [
      'pnpm-workspace.yaml',
      'nx.json',
      'turbo.json',
      'lerna.json',
      'rush.json',
    ];
    return monorepoFiles.some(file => existsSync4(join4(rootPath, file)));
  }
  async detectPackages(rootPath) {
    const packages = [];
    const packageJsonPath = join4(rootPath, 'package.json');
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
    const pnpmWorkspacePath = join4(rootPath, 'pnpm-workspace.yaml');
    if (existsSync4(pnpmWorkspacePath)) {
      try {
        const content = readFileSync2(pnpmWorkspacePath, 'utf-8');
        const packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*[^\n]+\n?)*)/);
        if (packagesMatch && packagesMatch[1]) {
          const packageLines = packagesMatch[1]
            .split(
              `
`
            )
            .filter(line => line.trim());
          for (const line of packageLines) {
            const packagePath = line.replace(/^\s*-\s*/, '').trim();
            if (packagePath) {
              packages.push(packagePath);
            }
          }
        }
      } catch (error) {}
    }
    const allPackageDirs = await this.findPackageDirectories(rootPath);
    packages.push(...allPackageDirs.filter(dir => dir !== '.'));
    return [...new Set(packages)];
  }
  async findPackageDirectories(rootPath) {
    const packageDirs = [];
    const scanDirectory = dir => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join4(dir, entry.name);
          const packageJsonPath = join4(fullPath, 'package.json');
          if (existsSync4(packageJsonPath)) {
            const relativePath = relative2(rootPath, fullPath);
            packageDirs.push(relativePath);
          }
          if (entry.name !== 'node_modules') {
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
      if (currentDepth > 3) return;
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join4(dir, entry.name);
          const relativePath = relative2(rootPath, fullPath);
          if (
            patterns.some(
              pattern =>
                entry.name === pattern ||
                entry.name.includes(pattern) ||
                entry.name.toLowerCase().includes(pattern.toLowerCase())
            )
          ) {
            directories.push(relativePath);
          }
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            scanDirectory(fullPath, currentDepth + 1);
          }
        }
      }
    };
    scanDirectory(rootPath);
    return [...new Set(directories)];
  }
  detectPackageManager(rootPath) {
    const packageJsonPath = join4(rootPath, 'package.json');
    if (!existsSync4(packageJsonPath)) {
      return 'npm';
    }
    if (existsSync4(join4(rootPath, 'bun.lockb'))) {
      return 'bun';
    }
    if (existsSync4(join4(rootPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync4(join4(rootPath, 'yarn.lock'))) {
      return 'yarn';
    }
    if (existsSync4(join4(rootPath, 'bun.lock'))) {
      return 'bun';
    }
    if (existsSync4(join4(rootPath, 'package-lock.json'))) {
      return 'npm';
    }
    return 'npm';
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
    if (structure.workspaceType === 'nx' || structure.workspaceType === 'rush') {
      score += 2;
    } else if (structure.workspaceType === 'turbo' || structure.workspaceType === 'lerna') {
      score += 1;
    }
    if (score >= 8) {
      return 'complex';
    } else if (score >= 4) {
      return 'medium';
    } else {
      return 'simple';
    }
  }
}

// ../../packages/core/src/detection/detection-cache.ts
import { existsSync as existsSync5, statSync } from 'fs';

class DetectionCache {
  fileCache;
  configCache;
  dependencyCache;
  resultCache;
  defaultTTL;
  maxCacheSize;
  constructor(options = {}) {
    this.fileCache = new Map();
    this.configCache = new Map();
    this.dependencyCache = new Map();
    this.resultCache = new Map();
    this.defaultTTL = options.ttl ?? 5 * 60 * 1000;
    this.maxCacheSize = options.maxSize ?? 1000;
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
      mtime: stats.mtimeMs,
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
      timestamp: Date.now(),
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
      timestamp: Date.now(),
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
      mtime,
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
        maxSize: this.maxCacheSize,
      },
      configCache: {
        size: this.configCache.size,
        maxSize: this.maxCacheSize,
      },
      dependencyCache: {
        size: this.dependencyCache.size,
        maxSize: this.maxCacheSize,
      },
      resultCache: {
        size: this.resultCache.size,
        maxSize: this.maxCacheSize,
      },
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
    this.projectDetector = new ProjectDetector();
    this.toolDetector = new ToolDetector();
    this.dependencyChecker = new DependencyChecker();
    this.structureAnalyzer = new StructureAnalyzer();
    this.cache = cache ?? new DetectionCache();
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
        this.structureAnalyzer.analyzeStructure(rootPath),
      ]);
      const compatibility = await this.dependencyChecker.checkCompatibility(dependencies);
      const issues = this.generateIssues(
        project,
        tools,
        configs,
        dependencies,
        structure,
        compatibility
      );
      const recommendations = this.generateRecommendations(
        project,
        tools,
        configs,
        dependencies,
        structure,
        compatibility
      );
      const result = {
        project,
        tools,
        configs,
        dependencies,
        structure,
        issues,
        recommendations,
        timestamp: new Date().toISOString(),
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
    if (project.type === 'unknown') {
      issues.push('Could not determine project type');
    }
    const enabledTools = tools.filter(t => t.enabled);
    if (enabledTools.length === 0) {
      issues.push('No development tools detected');
    }
    if (compatibility.issues.length > 0) {
      issues.push(...compatibility.issues);
    }
    if (structure.sourceDirectories.length === 0) {
      issues.push('No source directories found');
    }
    if (structure.testDirectories.length === 0) {
      issues.push('No test directories found - consider adding tests');
    }
    const hasLinting = tools.some(t => t.name === 'eslint' && t.enabled);
    const hasFormatting = tools.some(t => t.name === 'prettier' && t.enabled);
    if (!hasLinting) {
      issues.push('No linting tool detected - consider adding ESLint');
    }
    if (!hasFormatting) {
      issues.push('No formatting tool detected - consider adding Prettier');
    }
    return issues;
  }
  generateRecommendations(project, tools, _configs, _dependencies, structure, compatibility) {
    const recommendations = [];
    recommendations.push(...compatibility.recommendations);
    const toolNames = tools.map(t => t.name);
    if (!toolNames.includes('typescript') && project.hasTypeScript) {
      recommendations.push('Add TypeScript configuration');
    }
    if (!toolNames.includes('vitest') && !toolNames.includes('jest')) {
      recommendations.push('Add a testing framework (Vitest or Jest)');
    }
    if (!toolNames.includes('eslint')) {
      recommendations.push('Add ESLint for code linting and quality checks');
    }
    if (!toolNames.includes('prettier')) {
      recommendations.push('Add Prettier for consistent code formatting');
    }
    if (structure.complexity === 'complex' && !structure.isMonorepo) {
      recommendations.push('Consider converting to monorepo structure for better organization');
    }
    if (structure.packages.length > 5 && structure.workspaceType === 'npm') {
      recommendations.push('Consider using pnpm or yarn workspaces for better performance');
    }
    if (toolNames.includes('eslint') && !toolNames.includes('prettier')) {
      recommendations.push('Add Prettier for consistent code formatting');
    }
    if (structure.testDirectories.length === 0) {
      recommendations.push('Set up testing structure with unit and integration tests');
    }
    return recommendations;
  }
}

// ../../packages/core/src/index.ts
var useCoreStore = create((set, get) => ({
  currentProject: null,
  plugins: new Map(),
  isLoading: false,
  error: null,
  actions: {
    setProject: project => set({ currentProject: project }),
    registerPlugin: plugin => {
      const plugins = new Map(get().plugins);
      plugins.set(plugin.name, plugin);
      set({ plugins });
    },
    setLoading: loading => set({ isLoading: loading }),
    setError: error => set({ error }),
    clearError: () => set({ error: null }),
  },
}));

class PluginManager {
  plugins = new Map();
  register(plugin) {
    this.plugins.set(plugin.name, plugin);
  }
  get(name) {
    return this.plugins.get(name);
  }
  list() {
    return Array.from(this.plugins.values());
  }
  async executeAnalysis(toolName, config, options) {
    const plugin = this.get(toolName);
    if (!plugin) {
      throw new Error(`Plugin '${toolName}' not found`);
    }
    return plugin.analyze(config, options);
  }
  validateConfiguration(toolName, config) {
    const plugin = this.get(toolName);
    if (!plugin) {
      return false;
    }
    return plugin.validate(config);
  }
}
var pluginManager = new PluginManager();

// src/commands/setup.ts
import { writeFileSync as writeFileSync2, existsSync as existsSync6 } from 'node:fs';

class SetupCommand extends BaseCommand {
  constructor(options) {
    super(options);
  }
  get setupOptions() {
    return this.options;
  }
  async execute() {
    this.log('Setting up DevQuality CLI...');
    const configPath = this.options.config ?? '.dev-quality.json';
    if (existsSync6(configPath) && !this.setupOptions.force) {
      this.log('Configuration file already exists. Use --force to overwrite.');
      return;
    }
    const config = await this.createConfiguration();
    if (this.setupOptions.interactive) {
      await this.interactiveSetup();
    }
    this.saveConfiguration(config, configPath);
    this.log('DevQuality CLI setup completed successfully!');
  }
  async createConfiguration() {
    const detectionEngine = new AutoConfigurationDetectionEngine();
    const rootPath = process.cwd();
    try {
      this.log('Auto-detecting project configuration...');
      const detectionResult = await detectionEngine.detectAll(rootPath);
      this.log(
        `Detected project: ${detectionResult.project.name} (${detectionResult.project.type})`
      );
      this.log(
        `Found ${detectionResult.tools.length} tools and ${detectionResult.dependencies.length} dependencies`
      );
      const tools = detectionResult.tools.map(tool => ({
        name: tool.name,
        version: tool.version,
        enabled: tool.enabled,
        config: tool.config,
        priority: tool.priority,
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
          source: detectionResult.structure.sourceDirectories[0] ?? './src',
          tests: detectionResult.structure.testDirectories[0] ?? './tests',
          config: detectionResult.structure.configDirectories[0] ?? './configs',
          output: './output',
        },
        settings: {
          verbose: false,
          quiet: false,
          json: false,
          cache: true,
        },
      };
    } catch (error) {
      this.log(`Auto-detection failed: ${error}. Using default configuration.`);
      return this.createDefaultConfiguration();
    }
  }
  createDefaultConfiguration() {
    const packageJsonPath = pathUtils.getConfigPath('package.json');
    let projectName = 'my-project';
    let projectVersion = '1.0.0';
    let projectDescription = 'A project analyzed by DevQuality';
    let projectType = 'backend';
    if (existsSync6(packageJsonPath)) {
      try {
        const packageJson = fileUtils.readJsonSync(packageJsonPath);
        projectName = packageJson.name ?? projectName;
        projectVersion = packageJson.version ?? projectVersion;
        projectDescription = packageJson.description ?? projectDescription;
        if (packageJson.dependencies?.['react'] || packageJson.devDependencies?.['react']) {
          projectType = 'frontend';
        } else if (packageJson.workspaces) {
          projectType = 'monorepo';
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
        source: './src',
        tests: './tests',
        config: './configs',
        output: './output',
      },
      settings: {
        verbose: false,
        quiet: false,
        json: false,
        cache: true,
      },
    };
  }
  getDefaultTools() {
    return [
      {
        name: 'typescript',
        version: '5.3.3',
        enabled: true,
        config: {},
        priority: 1,
      },
      {
        name: 'eslint',
        version: 'latest',
        enabled: true,
        config: {},
        priority: 2,
      },
      {
        name: 'prettier',
        version: 'latest',
        enabled: true,
        config: {},
        priority: 3,
      },
    ];
  }
  async interactiveSetup() {
    this.log('Interactive setup mode - coming soon!');
    this.log('For now, using default configuration.');
  }
  saveConfiguration(config, configPath) {
    try {
      const content = JSON.stringify(config, null, 2);
      writeFileSync2(configPath, content, 'utf-8');
      this.log(`Configuration saved to: ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }
  async loadConfig() {
    const path = this.options.config ?? '.dev-quality.json';
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
  constructor(options) {
    super(options);
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
      this.log('Current configuration:');
      process.stdout.write(this.formatOutput(config));
    } catch {
      this.log(`No configuration found. Run 'dev-quality setup' to create one.`, 'warn');
    }
  }
  async editConfig() {
    this.log('Edit configuration - opening in default editor...');
    this.log('This feature will be implemented in a future version.');
  }
  async resetConfig() {
    const configPath = this.options.config ?? '.dev-quality.json';
    this.log('Resetting configuration to defaults...');
    const defaultConfig = {
      name: 'my-project',
      version: '1.0.0',
      description: 'A project analyzed by DevQuality',
      type: 'backend',
      frameworks: [],
      tools: [
        {
          name: 'typescript',
          version: '5.3.3',
          enabled: true,
          config: {},
          priority: 1,
        },
        {
          name: 'eslint',
          version: 'latest',
          enabled: true,
          config: {},
          priority: 2,
        },
        {
          name: 'prettier',
          version: 'latest',
          enabled: true,
          config: {},
          priority: 3,
        },
      ],
      paths: {
        source: './src',
        tests: './tests',
        config: './configs',
        output: './output',
      },
      settings: {
        verbose: false,
        quiet: false,
        json: false,
        cache: true,
      },
    };
    try {
      fileUtils.writeJsonSync(configPath, defaultConfig);
      this.log(`Configuration reset and saved to: ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to reset configuration: ${error}`);
    }
  }
  async loadConfig() {
    const path = this.options.config ?? '.dev-quality.json';
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
class AnalyzeCommand extends BaseCommand {
  constructor(options) {
    super(options);
  }
  async execute() {
    this.log('Starting code quality analysis...');
    try {
      const config = await this.loadConfig();
      const toolsToRun = this.getToolsToRun(config);
      if (toolsToRun.length === 0) {
        this.log('No tools configured or enabled for analysis.', 'warn');
        return;
      }
      this.log(`Running analysis with tools: ${toolsToRun.join(', ')}`);
      const results = [];
      for (const toolName of toolsToRun) {
        this.logVerbose(`Running ${toolName} analysis...`);
        try {
          const result = await this.runToolAnalysis(toolName);
          results.push(result);
          if (result.success) {
            this.log(`${toolName} analysis completed successfully`);
          } else {
            this.log(`${toolName} analysis failed`, 'warn');
          }
        } catch (error) {
          this.log(`${toolName} analysis error: ${error}`, 'error');
          results.push({
            tool: toolName,
            success: false,
            data: { error: error instanceof Error ? error.message : String(error) },
            timestamp: new Date().toISOString(),
            duration: 0,
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
      this.log(`Analysis failed: ${error instanceof Error ? error.message : error}`, 'error');
      throw error;
    }
  }
  getToolsToRun(config) {
    const analyzeOptions = this.options;
    if (analyzeOptions.tools) {
      return analyzeOptions.tools.split(',').map(tool => tool.trim());
    }
    return (
      config.tools
        ?.filter(tool => tool.enabled)
        ?.map(tool => tool.name)
        ?.sort((a, b) => {
          const toolA = config.tools.find(t => t.name === a);
          const toolB = config.tools.find(t => t.name === b);
          return (toolA?.priority ?? 999) - (toolB?.priority ?? 999);
        }) ?? []
    );
  }
  async runToolAnalysis(toolName) {
    const startTime = Date.now();
    this.logVerbose(`Simulating ${toolName} analysis...`);
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    const success = Math.random() > 0.2;
    const result = {
      tool: toolName,
      success,
      data: {
        issues: success ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10,
        warnings: success ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 15) + 5,
        suggestions: Math.floor(Math.random() * 8),
        filesAnalyzed: Math.floor(Math.random() * 100) + 10,
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
    return result;
  }
  async outputResults(results) {
    const analyzeOptions = this.options;
    if (analyzeOptions.output) {
      const { writeFileSync: writeFileSync3 } = await import('node:fs');
      const content = this.formatOutput(results);
      writeFileSync3(analyzeOptions.output, content, 'utf-8');
      this.log(`Results saved to: ${analyzeOptions.output}`);
    } else {
      process.stdout.write(this.formatOutput(results));
    }
  }
  generateSummary(results) {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    return `${passed}/${total} tools passed, ${failed} failed`;
  }
  async loadConfig() {
    const path = this.options.config ?? '.dev-quality.json';
    try {
      const { readFileSync: readFileSync3 } = await import('node:fs');
      const content = readFileSync3(path, 'utf-8');
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
  constructor(options) {
    super(options);
  }
  get reportOptions() {
    return this.options;
  }
  async execute() {
    this.log('Generating quality report...');
    try {
      const config = await this.loadConfig();
      const reportType = this.reportOptions.type ?? 'summary';
      const reportFormat = this.reportOptions.format ?? 'html';
      this.log(`Generating ${reportType} report in ${reportFormat} format...`);
      const reportData = await this.generateReportData(config);
      await this.outputReport(reportData, reportFormat);
      this.log('Report generated successfully!');
    } catch (error) {
      this.log(
        `Report generation failed: ${error instanceof Error ? error.message : error}`,
        'error'
      );
      throw error;
    }
  }
  async generateReportData(config) {
    const mockAnalysisResults = [
      {
        tool: 'typescript',
        success: true,
        data: { issues: 2, warnings: 1, suggestions: 3 },
        timestamp: new Date().toISOString(),
        duration: 150,
      },
      {
        tool: 'eslint',
        success: true,
        data: { issues: 5, warnings: 8, suggestions: 12 },
        timestamp: new Date().toISOString(),
        duration: 320,
      },
      {
        tool: 'prettier',
        success: true,
        data: { issues: 0, warnings: 0, suggestions: 0 },
        timestamp: new Date().toISOString(),
        duration: 80,
      },
    ];
    return {
      project: config,
      results: mockAnalysisResults,
      summary: {
        total: mockAnalysisResults.length,
        passed: mockAnalysisResults.filter(r => r.success).length,
        failed: mockAnalysisResults.filter(r => !r.success).length,
        warnings: mockAnalysisResults.reduce((sum, r) => sum + r.data.warnings, 0),
      },
      generatedAt: new Date().toISOString(),
    };
  }
  async outputReport(reportData, format) {
    let content = '';
    switch (format) {
      case 'html':
        content = this.generateHtmlReport(reportData);
        break;
      case 'md':
        content = this.generateMarkdownReport(reportData);
        break;
      case 'json':
        content = JSON.stringify(reportData, null, 2);
        break;
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
    if (this.reportOptions.output) {
      const { writeFileSync: writeFileSync3 } = await import('node:fs');
      writeFileSync3(this.reportOptions.output, content, 'utf-8');
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
        ${data.results
          .map(
            result => `
            <div class="result ${result.success ? 'success' : 'failed'}">
                <h3>${result.tool}</h3>
                <p><strong>Status:</strong> ${result.success ? '✅ Passed' : '❌ Failed'}</p>
                <p><strong>Duration:</strong> ${result.duration}ms</p>
                <p><strong>Issues:</strong> ${result.data.issues}</p>
                <p><strong>Warnings:</strong> ${result.data.warnings}</p>
            </div>
        `
          )
          .join('')}
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

${data.results
  .map(
    result => `
### ${result.tool}

**Status:** ${result.success ? '✅ Passed' : '❌ Failed'}
**Duration:** ${result.duration}ms
**Issues:** ${result.data.issues}
**Warnings:** ${result.data.warnings}
**Suggestions:** ${result.data.suggestions}
`
  )
  .join('')}
`;
  }
  async loadConfig() {
    const path = this.options.config ?? '.dev-quality.json';
    try {
      const { readFileSync: readFileSync3 } = await import('node:fs');
      const content = readFileSync3(path, 'utf-8');
      const config = JSON.parse(content);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}

// src/components/app.tsx
import React3 from 'react';
import { Box, Text, useApp } from 'ink';
import { jsxDEV } from 'react/jsx-dev-runtime';
function App() {
  const { exit } = useApp();
  React3.useEffect(() => {
    const timer = setTimeout(() => {
      exit();
    }, 5000);
    return () => clearTimeout(timer);
  }, [exit]);
  return /* @__PURE__ */ jsxDEV(
    Box,
    {
      flexDirection: 'column',
      padding: 1,
      children: [
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV(
              Text,
              {
                bold: true,
                color: 'blue',
                children: ['DevQuality CLI v', version],
              },
              undefined,
              true,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV(
              Text,
              {
                children: 'Code Quality Analysis and Reporting Tool',
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginBottom: 1,
            children: /* @__PURE__ */ jsxDEV(
              Text,
              {
                dimColor: true,
                children: "Use 'dev-quality --help' for available commands",
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV(
                Text,
                {
                  color: 'green',
                  children: '✓',
                },
                undefined,
                false,
                undefined,
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Text,
                {
                  children: ' TypeScript configured',
                },
                undefined,
                false,
                undefined,
                this
              ),
            ],
          },
          undefined,
          true,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV(
                Text,
                {
                  color: 'green',
                  children: '✓',
                },
                undefined,
                false,
                undefined,
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Text,
                {
                  children: ' Commander.js CLI framework ready',
                },
                undefined,
                false,
                undefined,
                this
              ),
            ],
          },
          undefined,
          true,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsxDEV(
                Text,
                {
                  color: 'green',
                  children: '✓',
                },
                undefined,
                false,
                undefined,
                this
              ),
              /* @__PURE__ */ jsxDEV(
                Text,
                {
                  children: ' Ink interactive components available',
                },
                undefined,
                false,
                undefined,
                this
              ),
            ],
          },
          undefined,
          true,
          undefined,
          this
        ),
        /* @__PURE__ */ jsxDEV(
          Box,
          {
            marginTop: 1,
            children: /* @__PURE__ */ jsxDEV(
              Text,
              {
                dimColor: true,
                children: 'Starting interactive mode... (auto-exit in 5 seconds)',
              },
              undefined,
              false,
              undefined,
              this
            ),
          },
          undefined,
          false,
          undefined,
          this
        ),
      ],
    },
    undefined,
    true,
    undefined,
    this
  );
}

// src/index.ts
var program2 = new Command();
program2
  .name('dev-quality')
  .description('DevQuality CLI tool for code quality analysis and reporting')
  .version(version, '-v, --version', 'Display the version number')
  .helpOption('-h, --help', 'Display help for command')
  .allowUnknownOption(false)
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: command => command.name(),
  });
program2.option('--verbose', 'Enable verbose output', false);
program2.option('--quiet', 'Suppress all output except errors', false);
program2.option('--json', 'Output results as JSON', false);
program2.option('--config <path>', 'Path to configuration file', '.dev-quality.json');
program2.option('--no-cache', 'Disable caching', false);
program2
  .command('setup')
  .description('Initialize DevQuality for your project')
  .option('-f, --force', 'Force overwrite existing configuration', false)
  .option('-i, --interactive', 'Interactive setup mode', true)
  .action(async options => {
    try {
      const setupCommand = new SetupCommand(options);
      await setupCommand.execute();
    } catch (error) {
      process.stderr.write(`Setup failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('config')
  .description('Manage DevQuality configuration')
  .option('-s, --show', 'Show current configuration', false)
  .option('-e, --edit', 'Edit configuration', false)
  .option('-r, --reset', 'Reset to default configuration', false)
  .action(async options => {
    try {
      const configCommand = new ConfigCommand(options);
      await configCommand.execute();
    } catch (error) {
      process.stderr.write(`Config command failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('analyze')
  .alias('a')
  .description('Analyze code quality using configured tools')
  .option('-t, --tools <tools>', 'Comma-separated list of tools to run')
  .option('-o, --output <path>', 'Output file path for results')
  .option('-f, --format <format>', 'Output format (json, html, md)', 'json')
  .option('--fail-on-error', 'Exit with error code on analysis failures', false)
  .action(async options => {
    try {
      const analyzeCommand = new AnalyzeCommand(options);
      await analyzeCommand.execute();
    } catch (error) {
      process.stderr.write(`Analysis failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('report')
  .alias('r')
  .description('Generate comprehensive quality reports')
  .option('-t, --type <type>', 'Report type (summary, detailed, comparison)', 'summary')
  .option('-o, --output <path>', 'Output file path for report')
  .option('-f, --format <format>', 'Report format (html, md, json)', 'html')
  .option('--include-history', 'Include historical data in report', false)
  .action(async options => {
    try {
      const reportCommand = new ReportCommand(options);
      await reportCommand.execute();
    } catch (error) {
      process.stderr
        .write(`Report generation failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('quick')
  .alias('q')
  .description('Quick analysis with default settings')
  .action(async () => {
    try {
      const analyzeCommand = new AnalyzeCommand({ quick: true });
      await analyzeCommand.execute();
    } catch (error) {
      process.stderr.write(`Quick analysis failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('watch')
  .alias('w')
  .description('Watch for changes and run analysis automatically')
  .option('-d, --debounce <ms>', 'Debounce time in milliseconds', '1000')
  .option('-i, --interval <ms>', 'Check interval in milliseconds', '5000')
  .action(async options => {
    try {
      const { render: render2 } = await import('ink');
      const { WatchComponent: WatchComponent2 } = await Promise.resolve().then(
        () => (init_watch(), exports_watch)
      );
      render2(React5.createElement(WatchComponent2, options));
    } catch (error) {
      process.stderr.write(`Watch mode failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('export')
  .description('Export analysis results to various formats')
  .option('-i, --input <path>', 'Input file path (JSON results)')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Export format (csv, xml, pdf)', 'csv')
  .action(async options => {
    try {
      const { ExportCommand: ExportCommand2 } = await Promise.resolve().then(
        () => (init_export(), exports_export)
      );
      const exportCommand = new ExportCommand2(options);
      await exportCommand.execute();
    } catch (error) {
      process.stderr.write(`Export failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2
  .command('history')
  .description('View analysis history and trends')
  .option('-n, --limit <number>', 'Number of history entries to show', '10')
  .option('--plot', 'Show trend visualization', false)
  .action(async options => {
    try {
      const { HistoryCommand: HistoryCommand2 } = await Promise.resolve().then(
        () => (init_history(), exports_history)
      );
      const historyCommand = new HistoryCommand2(options);
      await historyCommand.execute();
    } catch (error) {
      process.stderr
        .write(`History command failed: ${error instanceof Error ? error.message : error}
`);
      process.exit(1);
    }
  });
program2.on('command:*', () => {
  process.stderr.write(`Invalid command: ${program2.args.join(' ')}
See --help for a list of available commands.
`);
  process.exit(1);
});
if (process.argv.length === 2) {
  render(React5.createElement(App));
} else {
  program2.parse();
}
export { program2 as program };

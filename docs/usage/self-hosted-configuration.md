---
title: Self-Hosted configuration
description: Self-Hosted configuration usable in config file, CLI or environment variables
---

# Self-Hosted configuration options

Only use these configuration options when you _self-host_ Renovate.

Do _not_ put the self-hosted config options listed on this page in your "repository config" file (`renovate.json` for example), because Renovate will ignore those config options, and may also create config warnings.

The config options below _must_ be configured in the bot/admin config, so in either a environment variable, CLI option, or a special file like `config.js`.

!!! note
  Renovate supports `JSONC` for `.json` files and any config files without file extension (e.g. `.renovaterc`).

For information about how to configure Renovate with a `config.js` see the [Using `config.js` documentation](./getting-started/running.md#using-configjs).

!!! tip
  This documentation corresponds with the JSON schema in [`docs.renovatebot.com/renovate-global-schema.json`](renovate-global-schema.json), and any [inherited config options](./config-overview.md#inherited-config) which have [inheritConfigSupport](./self-hosted-configuration.md#inheritconfigsupport).

Please also see [Self-Hosted Experimental Options](./self-hosted-experimental.md).

!!! note
  Config options with `type=string` are always non-mergeable, so `mergeable=false`.

## `allowCustomCrateRegistries`

## `allowPlugins`

## `allowScripts`

## `allowShellExecutorForPostUpgradeCommands`

Enabling this allows `postUpgradeTasks`' `commands` to execute as if they're in a shell.

This takes effect if you are using shell semantics, such as:

```json {title="allowShellExecutorForPostUpgradeCommands=true will allow this to run as expected" configType=global}
{
  "postUpgradeTasks": {
    "commands": ["echo '...' > go.mod", "go mod tidy || true"],
    "fileFilters": ["**/*.go"],
    "executionMode": "branch"
  }
}
```

This will not affect calling a script like:

```json {title="allowShellExecutorForPostUpgradeCommands=true will have not effect" configType=global}
{
  "postUpgradeTasks": {
    "commands": ["bash .scripts/post-yarn-update.sh"],
    "fileFilters": ["yarn.lock", "**/*.js"],
    "executionMode": "update"
  }
}
```

!!! warning
  This has the risk of arbitrary environment variable access or additional command execution.
  It is very likely this will be susceptible to these risks, even if you allowlist (via `allowedCommands`),
  as there may be special characters included in the given commands that can be leveraged

## `allowedCommands`

A list of regular expressions that decide which commands in `postUpgradeTasks` are allowed to run.

If you are using a template command, the regular expression should match the final resolved value.
If this list is empty then no tasks will be executed.

For example:

```json {configType=global}
{
  "allowedCommands": ["^tslint --fix$", "^tslint --[a-z]+$"]
}
```

This configuration option was formerly known as `allowedPostUpgradeCommands`.

## `allowedEnv`

Bot administrators can allow users to configure custom environment variables within repo config.
Only environment variables matching the list will be accepted in the [`env`](./configuration-options.md#env) configuration.

Examples:

```json title="renovate.json"
{
  "env": {
    "SOME_ENV_VARIABLE": "some_value",
    "EXTRA_ENV_NAME": "value"
  }
}
```

The above would require `allowedEnv` to be configured similar to the following:

```js title="config.js"
module.exports = {
  allowedEnv: ['SOME_ENV_*', 'EXTRA_ENV_NAME'],
};
```

`allowedEnv` values can be exact match header names, glob patterns, or regex patterns.
For more details on the syntax and supported patterns, see Renovate's [String Pattern Matching documentation](./string-pattern-matching.md).

## `allowedHeaders`

`allowedHeaders` can be useful when a registry uses a authentication system that's not covered by Renovate's default credential handling in `hostRules`.
By default, all headers starting with "X-" are allowed.
If needed, you can allow additional headers with the `allowedHeaders` option.
Any set `allowedHeaders` overrides the default "X-" allowed headers, so you should include them in your config if you wish for them to remain allowed.
The `allowedHeaders` config option takes an array of minimatch-compatible globs or re2-compatible regex strings.
For more details on this syntax see Renovate's [string pattern matching documentation](./string-pattern-matching.md).

Examples:

| Example header | Kind of pattern  | Explanation                                 |
| -------------- | ---------------- | ------------------------------------------- |
| `/X/`          | Regex            | Any header with `x` anywhere in the name    |
| `!/X/`         | Regex            | Any header without `X` anywhere in the name |
| `X-*`          | Global pattern   | Any header starting with `X-`               |
| `X`            | Exact match glob | Only the header matching exactly `X`        |

```json {configType=global}
{
  "allowedHeaders": ["X-Auth-Token"],
  "hostRules": [
    {
      "matchHost": "https://domain.com/all-versions",
      "headers": {
        "X-Auth-Token": "secret"
      }
    }
  ]
}
```

Or with custom `allowedHeaders`:

```js title="config.js"
module.exports = {
  allowedHeaders: ['custom-header'],
};
```

## `allowedUnsafeExecutions`

This should be configured to a list of commands which are allowed to be run automatically as part of a dependency upgrade.

This is a separate class of commands that could be executed compared to [`allowedCommands`](#allowedcommands), or package managers that are controlled with [`allowScripts=true`](#allowscripts) and which should be independently configured.
As there is a security risk of running these commands automatically when a dependency upgrades, self hosted implementations need to explicitly declare which commands are permitted for their installation.
For more details of where this may be found, see ["Trusting Repository Developers"](./security-and-permissions.md#trusting-repository-developers).

Allowed options:

| Option          | Description                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------- |
| `bazelModDeps`  | Allows the `bazel mod deps` when perfoming bazelisk or bazel-module updates.                  |
| `goGenerate`    | Allows the `goGenerate` `postUpdateOption` to run after a go mod update.                      |
| `gradleWrapper` | Allows using `./gradlew` or `gradle.bat` when performing updates with Gradle.                 |
| `mise`          | Allows running any `mise` commands, for instance `mise lock` when updating `mise.lock` files. |

## `autodiscover`

When you enable `autodiscover`, by default, Renovate runs on _every_ repository that the bot account can access.
You can limit which repositories Renovate can access by using the `autodiscoverFilter` config option.

## `autodiscoverFilter`

You can use this option to filter the list of repositories that the Renovate bot account can access through `autodiscover`.
The pattern matches against the organization/repo path.

This option supports an array of minimatch-compatible globs or RE2-compatible regex strings.
For more details on this syntax see Renovate's [string pattern matching documentation](./string-pattern-matching.md).

If you set multiple filters, then the matches of each filter are added to the overall result.

If you use an environment variable or the CLI to set the value for `autodiscoverFilter`, then commas `,` within filters are not supported.
Commas will be used as delimiter for a new filter.

```
# DO NOT use commas inside the filter if your are using env or cli variables to configure it.
RENOVATE_AUTODISCOVER_FILTER="/MyOrg/{my-repo,foo-repo}"


# in this example you can use regex instead
RENOVATE_AUTODISCOVER_FILTER="/MyOrg\/(my|foo)-repo/"
```

**Minimatch**:

The configuration:

```json {configType=global}
{
  "autodiscoverFilter": ["my-org/*", "!my-org/old-*"]
}
```

Glob patterns are case-insensitive.

**Regex**:

All text inside the start and end `/` will be treated as a regular expression.
If using negations, all repositories except those who match the regex are added to the result:

```json {configType=global}
{
  "autodiscoverFilter": ["/project/.*/", "!/project/old-/"]
}
```

## `autodiscoverNamespaces`

You can use this option to autodiscover projects in specific namespaces (a.k.a. groups/organizations/workspaces).
In contrast to `autodiscoverFilter` the filtering is done by the platform and therefore more efficient.

For example:

```json {configType=global}
{
  "platform": "gitlab",
  "autodiscoverNamespaces": ["a-group", "another-group/some-subgroup"]
}
```

!!! note
  On Gitea/Forgejo, you can't use `autodiscoverTopics` together with `autodiscoverNamespaces` because both platforms do not support this.
  Topics are preferred and `autodiscoverNamespaces` will be ignored when you configure `autodiscoverTopics` on Gitea/Forgejo.

## `autodiscoverProjects`

You can use this option to filter the list of autodiscovered repositories by project names.
This feature is useful for users who want Renovate to only work on repositories within specific projects or exclude certain repositories from being processed.

```json {title="Example for Bitbucket" configType=global}
{
  "platform": "bitbucket",
  "autodiscoverProjects": ["a-group", "!another-group/some-subgroup"]
}
```

The `autodiscoverProjects` config option takes an array of minimatch-compatible globs or RE2-compatible regex strings.
For more details on this syntax see Renovate's [string pattern matching documentation](./string-pattern-matching.md).

## `autodiscoverRepoOrder`

The order method for autodiscover server side repository search.

> If multiple `autodiscoverTopics` are used resulting order will be per topic not global.

## `autodiscoverRepoSort`

The sort method for autodiscover server side repository search.

Platform supported sort options:

| Platform       | Supported sort options                      |
| -------------- | ------------------------------------------- |
| GitLab         | `created_at`, `updated_at`, `id`            |
| Forgejo, Gitea | `alpha`, `created`, `updated`, `size`, `id` |

> If multiple `autodiscoverTopics` are used resulting order will be per topic not global.

## `autodiscoverTopics`

Some platforms allow you to add tags, or topics, to repositories and retrieve repository lists by specifying those
topics. Set this variable to a list of strings, all of which will be topics for the autodiscovered repositories.

For example:

```json {configType=global}
{
  "autodiscoverTopics": ["managed-by-renovate"]
}
```

## `baseDir`

By default Renovate uses a temporary directory like `/tmp/renovate` to store its data.
You can override this default with the `baseDir` option.

For example:

```json {configType=global}
{
  "baseDir": "/my-own-different-temporary-folder"
}
```

## `bbUseDevelopmentBranch`

By default, Renovate will use a repository's "main branch" (typically called `main` or `master`) as the "default branch".

Configuring this to `true` means that Renovate will detect and use the Bitbucket [development branch](https://support.atlassian.com/bitbucket-cloud/docs/branch-a-repository/#The-branching-model) as defined by the repository's branching model.

If the "development branch" is configured but the branch itself does not exist (e.g. it was deleted), Renovate will fall back to using the repository's "main branch". This fall back behavior matches that of the Bitbucket Cloud web interface.

## `binarySource`

Renovate often needs to use third-party tools in its PRs, like `npm` to update `package-lock.json` or `go` to update `go.sum`.

Renovate supports four possible ways to access those tools:

- `global`: Uses pre-installed tools, e.g. `npm` installed via `npm install -g npm`.
- `install` (default): Downloads and installs tools at runtime if running in a [Containerbase](https://github.com/containerbase/base) environment, otherwise falls back to `global`
- `hermit`: Uses the [Hermit](https://github.com/cashapp/hermit) tool installation approach.
- `mise`: Uses the [mise](https://mise.jdx.dev/) project environment when a supported mise configuration is found.

When using `binarySource=mise`, Renovate looks for mise configuration in these standard locations while walking up from the working directory:

- `mise.toml`
- `mise/config.toml`
- `.mise/config.toml`
- `.config/mise.toml`
- `.config/mise/config.toml`
- `.config/mise/conf.d/*.toml`

If no mise configuration is found for a repository, Renovate falls back to regular execution without mise environment injection. Renovate also ignores `constraints` and other tool constraints when `binarySource=mise`, delegating tool version selection to mise itself.

If you are running Renovate in an environment where runtime download and install of tools is not possible then you should use the "full" image.

If you are building your own Renovate image, e.g. by installing Renovate using `npm`, then you will need to ensure that all necessary tools are installed globally before running Renovate so that `binarySource=global` will work.

!!! warning
  The usage of `binarySource=docker` is deprecated, and [will be removed in the future](https://github.com/renovatebot/renovate/issues/40747).

We also have a deprecated `docker` mode.

For this to work, `docker` needs to be installed and the Docker socket available to Renovate.

If you are using this mode, and cannot migrate to `binarySource=install`, [please provide feedback in this Discussion](https://github.com/renovatebot/renovate/discussions/40742).

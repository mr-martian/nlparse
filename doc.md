# Documentation
All settings files are JSON text. All objects must have the parameter "thisisa". The following values are recognized:

## grammar
This is the toplevel object of the main file. It currently takes the following parameters:
- language
  - The language code, "en", "es", "zh", etc.
- syntax
  - An object, each key is the name of a rule and each value is that rule.
```JSON
{"adj-noun": [syntaxrule], "subject": [syntaxrule], ...}
```
- morphology
  - same as syntax, but each value can be "litdict", "load", or "morphologyrule".

## langname
Stored in the array in ```nlparse/langs/langs.json```, takes parameters "code", "shortname", "longname".
```JSON
{
  "thisisa": "langname",
  "code": "en",
  "shortname": "English",
  "longname": "Standard American English"
}
```

## list
## merge
## morphologyrule
## node
A single word. ```"type"``` identifies the type (for example "noun", "adj", "verb"), ```"is"``` is word itself, and ```"descs"``` is an array of describers (such as adjectives on nouns). All other properties are syntactic data (like ```"valency": "transitive"``` on a verb).

## noderef
Only parameter ```"node"``` (integer), will equate to the nth node matched (from 0) in a syntaxrule or to the parse results in a morphologyrule (currently only 0).

## or
Only parameter ```"options"``` (array), will equate to any of the items in ```"options"```.

## syntaxrule
Defines a syntactic modification. Rules match a sequence of nodes (```"nodes"```) and apply a transformation (```"function"```), rules listed in ```"next"``` will be attempted next if the match was successful.

## wildcard
Has parameter ```"id"```, if id is null, will match anything, otherwise will match if all other wildcards with the same id are matched with the same thing.

## wordify
Directs the splitting of text into words. Has parameters ```"words"``` regex or array of regexes that match words and ```"skip"``` regex or array of regexes which match things that should be ignored (such as spaces).

## Substitutions
Because this stuff gets tedious to type, a feature has been added to allow certain strings to be equivalent to various structures.

These can currently be used anywhere in the main file except certain properties of ```"morphologyrule"```s, which expect regexs. They will not be evaluated in loaded files.

|       string                             |            expansion                                         |        comment       |
|------------------------------------------|--------------------------------------------------------------|----------------------|
| ```"[a b c ...]"```                      |       ```[a, b, c, ...]```                                   |                      |
|      ```"$x"```                          | ```{"thisisa": "node", "type": x}```                         |                      |
|      ```"!x"```                          |  equivalent to ```[x null]```                                |                      |
| ```$x{[a0 a1] [b0 b1 b2] ...}```         | ```{"thisisa": "node", "type": x, a0: a1, b0: b1, ...}```    |                      |
|             ```#x```                     | ```{"thisisa": "noderef", "node": x}```                      | x must be an integer |
|             ```@x```                     | ```{"thisisa": "wildcard", "id": x}```                       | x must be an integer |
|           ```(a b c ...)```              | ```{"thisisa": "or", "options": [a, b, c]}```                |                      |
|         ```+x```                         | ```{"thisisa": "merge", "things": x}```                      | x must be an array   |
|           ```*[a b c]```                 | equivalent to ```+[a ${[b c]}]```                            | previously "set"     |
|   ```? [p] [f] [n]```                    | ```{"thisisa": "syntaxrule", "nodes": p, "function": f, "next": n}``` |             |

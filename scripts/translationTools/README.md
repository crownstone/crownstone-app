# Translation Scripts

If you have new text in the app, you first run the textExtractorForTranslation.js

```$xslt
node textExtractorForTranslation.js
```

This will update the base language file (en_us.tsx) with the easy to find entries.

You then run the interactive text extractor:

```$xslt
node interactiveTextExtractor.js
```

This wil give a list of hashes as well as found strings. These are not always right.

The ones you do not want to see and translate, you copy the hashes into the ./config/ignoreHashes.js like so:

```js
module.exports = {
  '5e5cdb6559c10daff3c676e24ece693435067a53':true,
  'fe68e2aa909783d89ee8a4ec9a0bef25d741132d':true,
  'a357a56bf1ef7139b8e8e78de4482772ee98cb47':true,
  'd1f7223d108801b77571a60ca7237d7c9c288e2e':true,
  'cc1950ecff197f633c4bdd42fa19b8fc95aae23e':true,
  '780855b1dabda288503feb0432cc4eadc2e70a32':true,
  '79ace863eebe3c48e399036e5d091888d88077d1':true,
  'dcdd1c7a959466ef892c0019071bb7dbf0c2dd48':true,
  '21abf2d5ff3c6aaa915f72887ab1347612323249':true,
}
```

The ones you do wish to replace you copy into ./config/replacementHashes.js.

You then run the script again and the replacements will be made.

```$xslt
node interactiveTextExtractor.js
```

Finally, we want to copy the changes to the other language files by running maintain language files:

```$xslt
node maintainLanguageFiles.js
```


If you find strings in the code that need manual extraction, open the translationHelper.html.
Cut the text from the code and paste it into the textbox. Click next to the textbox. Your clipboard is now loaded
with translation file format entries. Paste that into the en_us.ts file and the lang(..) back at the position of the initial string.

Once that is done, run the maintainLanguageFiles.js script to sync this to the other languages.
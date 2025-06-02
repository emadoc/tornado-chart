// @ts-nocheck
import numbro from 'numbro';

export function formatNumber(number, format, showNumberScale = true) {
  let numberFormatOptions = getFormatOptions(format);
  let isCustomRound = true;

  // numbro.registerLanguage(fixNumbro(numbro_enUS)); // NOTE: this fixes an issue where en-US is reset to default in handsontable

  const {
    decimalPlaces,
    isThousandsSeparated = false,
    prefix = '',
    suffix = '',
    isPercent = false
  } = numberFormatOptions ?? {};

  const showAverage = showNumberScale !== false;
  const numbroOptions = {
    prefix: prefix,
    postfix: suffix,
    thousandSeparated: isThousandsSeparated,
    output: isPercent ? 'percent' : 'number',
    average: showAverage
  };

  const absNum = Math.abs(number);
  if (decimalPlaces !== undefined) {
    numbroOptions.mantissa = decimalPlaces;
    if (decimalPlaces === 0 && isCustomRound) {
      numbroOptions.trimMantissa = true; // NOTE: can add "&& absNum < 1" without trimMantissa, but old-logic force 2-decimals (incase fractions exist) when isCustomRound
      if (absNum >= 0.1) {
        numbroOptions.mantissa = 2;
      } else if (absNum >= 0.01) {
        numbroOptions.mantissa = 3;
      } else if (absNum >= 0.001) {
        numbroOptions.mantissa = 5;
      } else if (absNum >= 0.0001) {
        numbroOptions.mantissa = 6;
      } else if (absNum >= 0.00001) {
        numbroOptions.mantissa = 7;
      } else if (absNum >= 0.000001) {
        numbroOptions.mantissa = 8;
      }
    }
  }

  // Fix mantissa incase of showAverage
  if (decimalPlaces === undefined && showAverage) {
    numbroOptions.mantissa = MAX_MANTISSA;
    numbroOptions.trimMantissa = true;
  }

  // Force average selection
  if (showAverage) {
    const NumberScales = [
      { key: 'trillion', value: 1000000000000 },
      { key: 'billion', value: 1000000000 },
      { key: 'million', value: 1000000 },
      { key: 'thousand', value: 1000 }
    ];
    for (let i = 0; i < NumberScales.length; i++) {
      if (Math.abs(number) >= NumberScales[i].value) {
        numbroOptions.forceAverage = NumberScales[i].key;
        break;
      }
    }
  }

  return numbro(number).format(numbroOptions)?.toUpperCase();
}

export function getFormatOptions(value: string) {
  if (!value) {
    //Fallback to default format to prevent charts crash
    //Log stack trace to catch these scenarios
    value = '###,##0.00';
    // console.trace('Unexpected empty format value');
  }
  const [, prefix, thousandsFormat, decimalFormat, percent, suffix] =
    /^('[^']+'|[^0#.%';]*)([#]*,[#]*)?([0#]*\.[0#]*)?(#*%)?('[^']+'|[^0#.%';]*)/g.exec(value) ?? [];

  let decimalPlaces: number | undefined = 0; // case rounded
  if (decimalFormat?.length) {
    decimalPlaces = /\.(0+)/g.exec(decimalFormat)?.[1]?.length; // value or undefined (i.e. auto decimal places)
  }

  const unwrappedPrefix = prefix.replace(/'/g, '');
  const unwrappedSuffix = suffix.replace(/'/g, '');

  return {
    decimalPlaces,
    isThousandsSeparated: !!thousandsFormat,
    prefix: unwrappedPrefix,
    suffix: unwrappedSuffix,
    isPercent: !!percent
  };
}

// function fixNumbro(lang: any) {
//   const abbreviations = Object.keys(lang.abbreviations).reduce<{ [key: string]: string }>(
//     (acc, key) => {
//       const newVal =
//         lang.abbreviations[key].charAt(0).toUpperCase() + lang.abbreviations[key].slice(1);
//       acc[key] = newVal;
//       return acc;
//     },
//     {}
//   );
//   return { ...lang, abbreviations };
// }

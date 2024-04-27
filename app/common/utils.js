const isBrowser = () => {
    return (
      typeof window !== "undefined" && typeof window.document !== "undefined"
    );
  };
  
  const isNode = () => {
    return (
      typeof process !== "undefined" &&
      process.versions != null &&
      process.versions.node != null
    );
  };

const convertStringToBase64 = (string) => {
    if (isNode()) {
      return Buffer.from(string, "utf-8").toString("base64");
    } else if (isBrowser()) {
      return window.btoa(string);
    } else {
      throw new FDKException("Base64 conversion error: Unsupported environment");
    }
  };


module.exports = { convertStringToBase64: convertStringToBase64 }
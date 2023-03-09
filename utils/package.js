module.exports = {
  updatePackages: (packages, file) => {
    let updatedFile = file;

    const parsed = packages.map((package) => {
      const [name, version] = package.split("@");
      return { name, version };
    });

    parsed.forEach(({ name, version }) => {
      const prevPackageRe = new RegExp(`"${name}": ".+"`, "i");
      updatedFile = updatedFile.replace(
        prevPackageRe,
        `"${name}": "${version}"`
      );
    });
    return updatedFile;
  },
};

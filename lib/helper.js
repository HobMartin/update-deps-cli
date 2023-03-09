module.exports = {
  buildChoices: (data) => data.map(({ name }) => name),
  buildMultiChoices: (data, { name, value }) =>
    data.map((item) => ({ name: item[name], value: item[value] })),
};

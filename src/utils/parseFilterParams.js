const parseContactType = (contactType) => {
  if (typeof contactType !== 'string') return null;

  const allowedcontactTypes = ['work', 'home', 'personal'];
  return allowedcontactTypes.includes(contactType) ? contactType : null;
};

const parseBoolean = (isFavourite) => {
  if (typeof isFavourite === 'string') {
    if (isFavourite.toLowerCase() === 'true') return true;
    if (isFavourite.toLowerCase() === 'false') return false;
  }
  return null;
};

export const parseFilterParams = (query) => {
  const { isFavourite, contactType } = query;

  return {
    isFavourite: parseBoolean(isFavourite),
    contactType: parseContactType(contactType),
  };
};

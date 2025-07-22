exports.createGym = async (req, res) => {
  res.json({ message: 'Gym created successfully (only superadmin)' });
};
const Member = require('../models/Member');
const { validateMemberInput } = require('../utils/validators');

exports.createMember = async (req, res) => {
  const { name, email, phone, plan, assignedTrainer } = req.body;
  
  const { errors, isValid } = validateMemberInput(req.body);
  
  if (!isValid) {
    return res.status(400).json(errors);
  }

  try {
    const member = new Member({
      tenantId: req.user.tenantId,
      name,
      email,
      phone,
      plan,
      assignedTrainer
    });

    await member.save();

    res.status(201).json(member);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMembers = async (req, res) => {
  try {
    const members = await Member.find({ tenantId: req.user.tenantId });
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
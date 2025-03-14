const { sendVerificationCode } = require('../services/email_service');
const { generateVerificationCode } = require('../utils/code_generate');

exports.sendVerificationCodeController = async (req, res) => {
  try {
    const { email } = req.body;
    
    const code = generateVerificationCode();
    
    const result = await sendVerificationCode(email, code);
    
    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Код подтверждения отправлен' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Не удалось отправить код' 
      });
    }
  } catch (error) {
    console.error('Ошибка в контроллере:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера' 
    });
  }
};
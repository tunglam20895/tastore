import Toast from 'react-native-toast-message';

export function showSuccess(message: string) {
  Toast.show({
    type: 'success',
    text1: 'Thành công',
    text2: message,
    position: 'top',
    visibilityTime: 2500,
    autoHide: true,
    topOffset: 60,
  });
}

export function showError(message: string) {
  Toast.show({
    type: 'error',
    text1: 'Lỗi',
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    autoHide: true,
    topOffset: 60,
  });
}

export function showInfo(message: string) {
  Toast.show({
    type: 'info',
    text1: 'Thông báo',
    text2: message,
    position: 'top',
    visibilityTime: 2500,
    autoHide: true,
    topOffset: 60,
  });
}

import { memo } from 'react';
import TextSearchInput from '../../shared/TextSearchInput';

const RegistrySearchInput = memo(function RegistrySearchInput({
  value,
  onChange,
  placeholder,
  widthClass,
}) {
  return (
    <TextSearchInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      widthClass={widthClass}
    />
  );
});

export default RegistrySearchInput;

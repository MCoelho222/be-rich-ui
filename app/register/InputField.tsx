import { colorClasses } from '@/config/colors';

interface InputFieldProps {
    inputLabel: string;
    inputId: string;
    inputName: string;
    inputType: string;
}

function InputField({inputLabel, inputId, inputName, inputType}: InputFieldProps) {
  return (
    <div className='flex flex-row gap-5'>
        <label htmlFor={inputId}>{inputLabel}</label>
        <input className={`${colorClasses.surface.background}`} id={inputId} name={inputName} type={inputType} />
    </div>
  )
}

export default InputField

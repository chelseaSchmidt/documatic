/* eslint-disable @typescript-eslint/no-explicit-any, react/jsx-props-no-spreading */
import { ErrorMessage, Field, FieldAttributes } from 'formik';

interface FormFieldProps extends FieldAttributes<any> {
  label: string;
  name: string;
  isLabelVisible: boolean;
}

const FormField = ({
  label,
  name,
  isLabelVisible,
  ...args
}: FormFieldProps) => {
  return (
    <>
      <label htmlFor={name} hidden={!isLabelVisible}>{label}</label>
      <Field name={name} id={name} {...args} />
      <ErrorMessage name={name} />
    </>
  );
};

export default FormField;

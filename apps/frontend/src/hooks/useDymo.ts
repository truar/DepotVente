export function useDymo() {
  window.dymo.label.framework.trace = 1 //true
  window.dymo.label.framework.init()

  const getPrinters = () => {
    return window.dymo.label.framework.getPrinters()
  }

  const print = () => {
    const testAddressLabelXml =
      '<?xml version="1.0" encoding="utf-8"?>\
    <DieCutLabel Version="8.0" Units="twips">\
        <PaperOrientation>Landscape</PaperOrientation>\
        <Id>Address</Id>\
        <PaperName>30252 Address</PaperName>\
        <DrawCommands>\
            <RoundRectangle X="0" Y="0" Width="1581" Height="5040" Rx="270" Ry="270" />\
        </DrawCommands>\
        <ObjectInfo>\
            <AddressObject>\
                <Name>Address</Name>\
                <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />\
                <BackColor Alpha="0" Red="255" Green="255" Blue="255" />\
                <LinkedObjectName></LinkedObjectName>\
                <Rotation>Rotation0</Rotation>\
                <IsMirrored>False</IsMirrored>\
                <IsVariable>True</IsVariable>\
                <HorizontalAlignment>Left</HorizontalAlignment>\
                <VerticalAlignment>Middle</VerticalAlignment>\
                <TextFitMode>ShrinkToFit</TextFitMode>\
                <UseFullFontHeight>True</UseFullFontHeight>\
                <Verticalized>False</Verticalized>\
                <StyledText>\
                    <Element>\
                        <String>DYMO\n3 Glenlake Parkway\nAtlanta, GA 30328</String>\
                        <Attributes>\
                            <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />\
                            <ForeColor Alpha="255" Red="0" Green="0" Blue="0" />\
                        </Attributes>\
                    </Element>\
                </StyledText>\
                <ShowBarcodeFor9DigitZipOnly>False</ShowBarcodeFor9DigitZipOnly>\
                <BarcodePosition>AboveAddress</BarcodePosition>\
                <LineFonts>\
                    <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />\
                    <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />\
                    <Font Family="Arial" Size="12" Bold="False" Italic="False" Underline="False" Strikeout="False" />\
                </LineFonts>\
            </AddressObject>\
            <Bounds X="332" Y="150" Width="4455" Height="1260" />\
        </ObjectInfo>\
    </DieCutLabel>'
    const label = window.dymo.label.framework.openLabelXml(testAddressLabelXml)

    console.log(label)
    label.print(getPrinters()[0].name)
  }

  const checkEnvironment = () => {
    return window.dymo.label.framework.checkEnvironment()
  }

  const checkEnvironmentResult = checkEnvironment()
  const printers = getPrinters()

  const isEnabled =
    checkEnvironmentResult.isBrowserSupported &&
    checkEnvironmentResult.isFrameworkInstalled &&
    checkEnvironmentResult.isWebServicePresent &&
    printers.length > 0

  console.log(checkEnvironmentResult)
  console.log(printers)

  return { isEnabled, getPrinters, print }
}

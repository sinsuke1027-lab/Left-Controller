import sys
try:
    import qrcode
except ImportError:
    print("Flag: qrcode-missing")
    sys.exit(0)

if len(sys.argv) < 2:
    print("Usage: python show_qr.py <url>")
    sys.exit(1)

url = sys.argv[1]

qr = qrcode.QRCode()
qr.add_data(url)
qr.print_ascii(invert=True)

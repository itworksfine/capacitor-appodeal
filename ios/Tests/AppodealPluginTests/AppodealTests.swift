import XCTest
import Appodeal
import StackConsentManager
@testable import AppodealPlugin

class AppodealTests: XCTestCase {
    func testMapsJavaScriptAdTypesToTheSdks() {
        XCTAssertEqual(Conversions.adType(Conversions.interstitial | Conversions.rewardedVideo), [.interstitial, .rewardedVideo])
        XCTAssertEqual(Conversions.adType(Conversions.bannerBottom), .banner)
        XCTAssertEqual(Conversions.adType(0), [])
        XCTAssertEqual(Conversions.jsAdType([.interstitial, .MREC]), Conversions.interstitial | Conversions.mrec)
    }

    func testPicksTheShowStyle() {
        XCTAssertEqual(Conversions.showStyle(Conversions.bannerTop), .bannerTop)
        XCTAssertEqual(Conversions.showStyle(Conversions.rewardedVideo), .rewardedVideo)
        XCTAssertNil(Conversions.showStyle(Conversions.mrec))
    }

    func testMapsConsentStatusesToTheJavaScriptValues() {
        XCTAssertEqual(Conversions.consentStatus(.unknown), 0)
        XCTAssertEqual(Conversions.consentStatus(.required), 1)
        XCTAssertEqual(Conversions.consentStatus(.notRequired), 2)
        XCTAssertEqual(Conversions.consentStatus(.obtained), 3)
        XCTAssertEqual(Conversions.privacyOptionsStatus(.unknown), 0)
        XCTAssertEqual(Conversions.privacyOptionsStatus(.required), 1)
        XCTAssertEqual(Conversions.privacyOptionsStatus(.notRequired), 2)
    }
}
